import BookingService from '../../src/core/Services/BookingService.js';
import Booking from '../../src/core/Models/Booking.js';
import AdminService from '../../src/core/Services/AdminService.js';
import Package from '../../src/core/Models/Package.js';
import InventoryService from '../../src/core/Services/InventoryService.js';
import NotificationService from '../../src/core/Services/NotificationService.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

describe('BookingService Test Suite', () => {
    let mockBookingId;
    let originalStartSession;

    beforeAll(() => {
        originalStartSession = mongoose.startSession;
        mongoose.startSession = async function() {
            const session = await originalStartSession.apply(this, arguments);
            session.startTransaction = () => {};
            session.commitTransaction = async () => {};
            session.abortTransaction = async () => {};
            return session;
        };
    });

    afterAll(() => {
        mongoose.startSession = originalStartSession;
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Globally mock side-effect services
        jest.spyOn(NotificationService, 'notifyBookingStatus').mockResolvedValue({});
        jest.spyOn(NotificationService, 'notifyPayout').mockResolvedValue({});

        const booking = await Booking.create({
            user: new mongoose.Types.ObjectId(),
            package: new mongoose.Types.ObjectId(),
            travelDate: new Date(),
            totalPrice: 1000,
            status: 'pending',
            paymentStatus: 'pending',
            razorpay: { orderId: 'order_test_123' }
        });
        mockBookingId = booking._id;
    });

    it('should successfully process a refund', async () => {
        const refunded = await BookingService.processRefund(mockBookingId);
        expect(refunded.status).toBe('cancelled');
        expect(refunded.refundStatus).toBe('refunded');
        expect(refunded.refundAmount).toBe(1000);
    });

    it('should mark a booking for payout', async () => {
        const payout = await BookingService.markPayout(mockBookingId);
        expect(payout.payoutStatus).toBe('paid');
    });

    it('should update payment status based on razorpay signatures', async () => {
        const paid = await BookingService.updatePaymentStatus('order_test_123', 'pay_123', 'sig_123');
        expect(paid.paymentStatus).toBe('paid');
        expect(paid.status).toBe('confirmed');
        expect(paid.razorpay.paymentId).toBe('pay_123');
        expect(paid.razorpay.signature).toBe('sig_123');
    });

    it('should throw mismatch error for invalid order IDs', async () => {
        await expect(
            BookingService.updatePaymentStatus('order_invalid', 'pay', 'sig')
        ).rejects.toThrow('Booking order mismatch');
    });

    describe('Transactions & Admin Logs', () => {

        beforeEach(() => {
            jest.spyOn(AdminService, 'logAction').mockResolvedValue(true);
        });

        it('should create booking for trekking slots', async () => {
             const mockPkgId = new mongoose.Types.ObjectId();
             jest.spyOn(Package, 'findById').mockResolvedValue({ _id: mockPkgId, vendor: new mongoose.Types.ObjectId() });
             jest.spyOn(InventoryService, 'checkAvailabilityRange').mockResolvedValue({ available: true });
             jest.spyOn(InventoryService, 'reserveSlotsRange').mockResolvedValue({});

             const booking = await BookingService.createBooking({
                  userId: new mongoose.Types.ObjectId(),
                  catalogId: mockPkgId,
                  category: 'trekking',
                  itemId: new mongoose.Types.ObjectId(),
                  travelDate: new Date(),
                  price: 500
             });
             expect(booking.status).toBe('pending');
             expect(booking.preferences.category).toBe('trekking');
        });

        it('should create booking for homestay rooms', async () => {
             const mockPkgId = new mongoose.Types.ObjectId();
             jest.spyOn(Package, 'findById').mockResolvedValue({ _id: mockPkgId, vendor: new mongoose.Types.ObjectId() });
             jest.spyOn(InventoryService, 'checkAvailabilityRange').mockResolvedValue({ available: true });
             jest.spyOn(InventoryService, 'reserveSlotsRange').mockResolvedValue({});

             const booking = await BookingService.createBooking({
                  userId: new mongoose.Types.ObjectId(),
                  catalogId: mockPkgId,
                  category: 'homestay',
                  itemId: new mongoose.Types.ObjectId(),
                  travelDate: new Date(),
                  price: 800
             });
             expect(booking.preferences.category).toBe('homestay');
        });

        it('should fail createBooking if no availability', async () => {
             const mockPkgId = new mongoose.Types.ObjectId();
             jest.spyOn(Package, 'findById').mockResolvedValue({ _id: mockPkgId, vendor: new mongoose.Types.ObjectId() });
             jest.spyOn(InventoryService, 'checkAvailabilityRange').mockResolvedValue({ available: false, failedDate: '2025-01-01' });

             await expect(
                 BookingService.createBooking({
                     userId: new mongoose.Types.ObjectId(),
                     catalogId: mockPkgId,
                     category: 'homestay',
                     itemId: new mongoose.Types.ObjectId(),
                     travelDate: new Date('2025-01-01'),
                     price: 800
                 })
             ).rejects.toThrow('Requested date 2025-01-01 is fully booked.');
        });

        it('should fail createBooking unconditionally and abort txn', async () => {
             jest.spyOn(Package, 'findById').mockRejectedValue(new Error('Txn fail'));
             await expect(
                 BookingService.createBooking({
                     catalogId: new mongoose.Types.ObjectId()
                 })
             ).rejects.toThrow('Txn fail');
        });

        it('should get booking by ID', async () => {
             const found = await BookingService.getBookingById(mockBookingId);
             expect(found._id.toString()).toBe(mockBookingId.toString());
        });

        it('should processRefund and log action with req context', async () => {
             jest.spyOn(Package, 'findById').mockResolvedValue({ _id: new mongoose.Types.ObjectId(), vendor: new mongoose.Types.ObjectId() });
             jest.spyOn(InventoryService, 'releaseSlotsRange').mockResolvedValue({});
             
             const req = { user: { id: new mongoose.Types.ObjectId().toString() } };
             const refunded = await BookingService.processRefund(mockBookingId, req);
             expect(refunded.status).toBe('cancelled');
             expect(AdminService.logAction).toHaveBeenCalled();
        });

        it('should throw processRefund for missing booking and abort txn', async () => {
             await expect(BookingService.processRefund(new mongoose.Types.ObjectId())).rejects.toThrow();
        });

        it('should markPayout and log action with req context', async () => {
             const req = { user: { _id: new mongoose.Types.ObjectId() } };
             const payout = await BookingService.markPayout(mockBookingId, req);
             expect(payout.payoutStatus).toBe('paid');
             expect(AdminService.logAction).toHaveBeenCalled();
        });

        it('should throw markPayout for missing booking and abort txn', async () => {
             await expect(BookingService.markPayout(new mongoose.Types.ObjectId())).rejects.toThrow();
        });
    });
});
