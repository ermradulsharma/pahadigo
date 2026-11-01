import { jest } from '@jest/globals';
import {
    createMockMongoose,
    createDynamicModel,
    createMockQueryHelpers
} from '../../utils/mockHelpers.js';

const mockMongoose = createMockMongoose();
jest.unstable_mockModule('mongoose', () => ({
    __esModule: true,
    default: mockMongoose,
    Schema: mockMongoose.Schema,
    model: mockMongoose.model,
    models: mockMongoose.models,
    Types: mockMongoose.Types
}));

const mockBooking = createDynamicModel();
const mockUser = createDynamicModel();
const mockDispute = createDynamicModel();
const mockCoupon = createDynamicModel();

jest.unstable_mockModule('@/core/Models/Booking.js', () => ({ default: mockBooking }));
jest.unstable_mockModule('@/core/Models/User.js', () => ({ default: mockUser }));
jest.unstable_mockModule('@/core/Models/Dispute.js', () => ({ default: mockDispute }));
jest.unstable_mockModule('@/core/Models/Coupon.js', () => ({ default: mockCoupon }));

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: { notifyBookingStatus: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/General/RazorpayService.js', () => ({
    default: { createOrder: jest.fn(), verifySignature: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Traveller/PackageService.js', () => ({
    default: { getAvailablePackageItem: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Traveller/InventoryService.js', () => ({
    default: { checkAvailabilityRange: jest.fn(), reserveSlotsRange: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        getBusinessById: jest.fn(() => Promise.resolve({
            businessName: 'Test Business',
            ownerName: 'Vendor Owner',
            bankDetails: {
                accountHolderName: 'Vendor Owner',
                accountNumber: '1234567890',
                ifscCode: 'TEST0001234',
                bankName: 'Test Bank'
            }
        }))
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn(() => Promise.resolve({
        razorpay: { key_id: 'test_key', key_secret: 'test_secret' },
        tax: { gst: 5, service_tax: 0 }
    })),
    clearAppConfigCache: jest.fn()
}));

const mockQHelpers = createMockQueryHelpers();
jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => mockQHelpers);

const { default: BookingService } = await import('@/core/Services/Traveller/BookingService.js');

describe('BookingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should be defined', () => {
        expect(BookingService).toBeDefined();
    });
});
