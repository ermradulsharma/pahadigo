import { jest } from '@jest/globals';
import PaymentController from '../../src/core/Http/Controllers/PaymentController.js';
import Booking from '../../src/core/Models/Booking.js';
import RazorpayService from '../../src/core/Services/RazorpayService.js';
import mongoose from 'mongoose';

describe('Payment API Controller Test Suite', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should successfully initiate a payment order', async () => {
        const booking = await Booking.create({
            user: new mongoose.Types.ObjectId(),
            package: new mongoose.Types.ObjectId(),
            travelDate: new Date(),
            totalPrice: 5000,
            status: 'pending',
            paymentStatus: 'pending',
            razorpay: {}
        });

        // Use spying instead of top-level mock for ESM stability
        const mockCreateOrder = jest.spyOn(RazorpayService, 'createOrder')
            .mockResolvedValue({ id: 'order_test_api' });

        const req = {
            user: { id: 'user123' },
            jsonBody: { bookingId: booking._id.toString() }
        };

        const res = await PaymentController.createOrder(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.data.order.id).toBe('order_test_api');
        expect(mockCreateOrder).toHaveBeenCalledWith(5000, booking._id.toString());
    });

    it('should fail verification on bad signature', async () => {
        const mockVerifySignature = jest.spyOn(RazorpayService, 'verifySignature')
            .mockReturnValue(false);

        const req = {
            jsonBody: {
                razorpay_order_id: 'order_1',
                razorpay_payment_id: 'pay_1',
                razorpay_signature: 'bad_sig'
            }
        };

        const res = await PaymentController.verifyPayment(req);
        expect(res.status).toBe(400);
    });
});
