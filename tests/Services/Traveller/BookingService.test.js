import { jest } from '@jest/globals';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

const mockQuery = {
    session: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then: jest.fn(function(resolve) { resolve(this._resolvedValue); }),
    _resolveWith: function(val) { this._resolvedValue = val; return this; }
};

jest.unstable_mockModule('@/models/Booking.js', () => ({
    default: { 
        create: jest.fn(), 
        findById: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery)
    }
}));

jest.unstable_mockModule('@/models/Package.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/models/Dispute.js', () => ({
    default: { create: jest.fn() }
}));

jest.unstable_mockModule('@/services/Traveller/InventoryService.js', () => ({
    default: {
        checkAvailabilityRange: jest.fn(),
        reserveSlotsRange: jest.fn(),
        releaseSlotsRange: jest.fn()
    }
}));

jest.unstable_mockModule('@/services/General/NotificationService.js', () => ({
    default: { notifyBookingStatus: jest.fn() }
}));

jest.unstable_mockModule('@/services/General/RazorpayService.js', () => ({
    default: { createOrder: jest.fn().mockResolvedValue({ id: 'order123' }) }
}));

jest.unstable_mockModule('mongoose', () => ({
    default: {
        startSession: jest.fn(() => ({
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        })),
        Schema: class {
            constructor() {}
            static Types = { ObjectId: String };
        },
        model: jest.fn(),
        Types: { ObjectId: String }
    }
}));

const { default: BookingService } = await import('@/services/Traveller/BookingService.js');
const { default: Booking } = await import('@/models/Booking.js');
const { default: Package } = await import('@/models/Package.js');
const { default: InventoryService } = await import('@/services/Traveller/InventoryService.js');
const { default: RazorpayService } = await import('@/services/General/RazorpayService.js');

describe('Industry Standard: BookingService Business Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = null;
    });

    describe('[initiateBooking]', () => {
        it('[Success] should create a booking when inventory is available', async () => {
            const mockPkg = { _id: 'pkg123', vendor: { toString: () => 'vendor456' } };
            
            Package.findById.mockResolvedValue(mockPkg);
            InventoryService.checkAvailabilityRange.mockResolvedValue({ available: true });
            Booking.create.mockImplementation((data) => Promise.resolve(data.map(d => ({ ...d, _id: 'book789' }))));

            const result = await BookingService.initiateBooking({
                userId: 'user1',
                catalogId: 'pkg123',
                category: 'trekking',
                itemId: 'item1',
                travelDate: new Date(),
                price: 1000,
                slots: 2
            });

            expect(result._id).toBe('book789');
            expect(Booking.create).toHaveBeenCalled();
            expect(InventoryService.reserveSlotsRange).toHaveBeenCalled();
        });

        it('[Failure] should throw error if package not found', async () => {
            Package.findById.mockResolvedValue(null);
            
            await expect(BookingService.initiateBooking({ catalogId: 'none' }))
                .rejects.toThrow(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
        });

        it('[Failure] should throw error if slots not available', async () => {
            Package.findById.mockResolvedValue({ _id: 'p', vendor: { toString: () => 'v' } });
            InventoryService.checkAvailabilityRange.mockResolvedValue({ available: false });

            await expect(BookingService.initiateBooking({ slots: 100 }))
                .rejects.toThrow(RESPONSE_MESSAGES.BOOKING.SLOTS_NOT_AVAILABLE);
        });
    });

    describe('[refundBooking]', () => {
        it('[Success] should update booking status and release inventory', async () => {
            const mockBooking = {
                _id: 'b1',
                status: 'confirmed',
                totalPrice: 2000,
                package: 'p1',
                startDate: new Date(),
                endDate: new Date(),
                bookingDetails: { category: 'cat1', itemId: 'i1' },
                timeline: [],
                save: jest.fn().mockResolvedValue(true)
            };
            
            mockQuery._resolveWith(mockBooking);
            Package.findById.mockResolvedValue({ vendor: { toString: () => 'v1' } });

            const result = await BookingService.refundBooking('b1', { user: { id: 'admin1' } });

            expect(result.status).toBe('cancelled');
            expect(result.refundStatus).toBe('refunded');
            expect(InventoryService.releaseSlotsRange).toHaveBeenCalled();
        });
    });
});
