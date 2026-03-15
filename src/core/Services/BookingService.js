import mongoose from 'mongoose';
import Booking from '@/models/Booking.js';
import AdminService from '@/services/AdminService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

class BookingService {
    async createBooking({ userId, catalogId, category, itemId, travelDate, price }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // 1. Atomic Inventory Decrement
            // Path depends on category. Homestays use 'availableRooms', Treks use 'availableSlots'
            let updateQuery = {};
            let matchQuery = { _id: catalogId };
            matchQuery[`${category}._id`] = itemId;

            if (category === 'homestay' || category === 'hotel') {
                matchQuery[`${category}.availability.availableRooms`] = { $gt: 0 };
                updateQuery[`${category}.$.availability.availableRooms`] = -1;
            } else if (category === 'trekking' || category === 'camping' || category === 'rafting') {
                matchQuery[`${category}.availability.availableSlots`] = { $gt: 0 };
                updateQuery[`${category}.$.availability.availableSlots`] = -1;
            }

            const updatedPackage = await Package.findOneAndUpdate(
                matchQuery,
                { $inc: updateQuery },
                { session, new: true }
            );

            if (!updatedPackage) {
                throw new Error('Requested service is fully booked or not found.');
            }

            // 2. Create Booking
            const booking = await Booking.create([{
                user: userId,
                package: catalogId,
                travelDate,
                totalPrice: price,
                status: 'pending',
                paymentStatus: 'pending',
                // Metadata for easy lookup
                preferences: { category, itemId }
            }], { session });

            await session.commitTransaction();
            return booking[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getBookingById(bookingId) {
        return await Booking.findById(bookingId);
    }

    async processRefund(bookingId, req = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

            booking.status = 'cancelled';
            booking.refundStatus = 'refunded';
            booking.refundAmount = booking.totalPrice;
            await booking.save({ session });

            // Audit Log via AdminService
            if (req && req.user) {
                const adminId = req.user.id || req.user._id;
                await AdminService.logAction(adminId, 'REFUND', 'BOOKING', bookingId, { amount: booking.totalPrice }, req, session);
            }

            await session.commitTransaction();
            return booking;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async markPayout(bookingId, req = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

            booking.payoutStatus = 'paid';
            await booking.save({ session });

            // Audit Log
            if (req && req.user) {
                const adminId = req.user.id || req.user._id;
                await AdminService.logAction(adminId, 'PAYOUT', 'BOOKING', bookingId, { status: 'paid' }, req, session);
            }

            await session.commitTransaction();
            return booking;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async updatePaymentStatus(orderId, paymentId, signature) {
        // Atomic update prevents concurrent webhook race conditions
        const booking = await Booking.findOneAndUpdate(
            { 'razorpay.orderId': orderId, paymentStatus: 'pending' },
            {
                $set: {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    'razorpay.paymentId': paymentId,
                    'razorpay.signature': signature
                }
            },
            { new: true }
        );

        if (!booking) throw new Error('Booking order mismatch');
        return booking;
    }
}

const bookingService = new BookingService();
export default bookingService;