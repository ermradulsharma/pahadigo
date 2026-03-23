import mongoose from 'mongoose';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import Dispute from '@/models/Dispute.js';
import AdminService from '@/services/AdminService.js';
import NotificationService from '@/services/NotificationService.js';
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
                { session, returnDocument: 'after' }
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
                preferences: { category, itemId },
                timeline: [{
                    title: 'Booking Requested',
                    description: 'Your booking request has been received and is pending payment.',
                    updatedBy: userId
                }]
            }], { session });

            await session.commitTransaction();
            
            // Asynchronously notify vendor & admin without blocking response
            NotificationService.notifyBookingStatus(booking[0]._id, 'created');

            return booking[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getBookingById(bookingId) {
        return await Booking.findById(bookingId).populate('user', 'name email phone').populate('package', 'title');
    }

    async getVendorBookings(vendorId) {
        // Find the vendor's catalog package
        const catalog = await Package.findOne({ vendor: vendorId });
        if (!catalog) return [];

        return await Booking.find({ package: catalog._id })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
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
            booking.timeline.push({
                title: 'Booking Cancelled & Refunded',
                description: `A refund of ₹${booking.totalPrice} has been processed.`,
                updatedBy: req?.user?.id || req?.user?._id
            });
            await booking.save({ session });

            // Audit Log via AdminService
            if (req && req.user) {
                const adminId = req.user.id || req.user._id;
                await AdminService.logAction(adminId, 'REFUND', 'BOOKING', bookingId, { amount: booking.totalPrice }, req, session);
            }

            await session.commitTransaction();

            // Notify about cancellation
            NotificationService.notifyBookingStatus(bookingId, 'cancelled');

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

            if (booking.isDisputed) {
                throw new Error('Payout cannot be processed because this booking is currently under a dispute hold.');
            }

            booking.payoutStatus = 'paid';
            await booking.save({ session });

            // Audit Log
            if (req && req.user) {
                const adminId = req.user.id || req.user._id;
                await AdminService.logAction(adminId, 'PAYOUT', 'BOOKING', bookingId, { status: 'paid' }, req, session);
            }

            await session.commitTransaction();

            // Notify Vendor about Payout
            NotificationService.notifyPayout(bookingId);

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
                },
                $push: {
                    timeline: {
                        title: 'Payment Confirmed',
                        description: 'Your payment was successful and the booking is confirmed.',
                        // updatedBy omitted here as it is system generated webhook
                    }
                }
            },
            { returnDocument: 'after' }
        );

        if (!booking) throw new Error('Booking order mismatch');

        // Notify that payment is complete and booking is confirmed
        NotificationService.notifyBookingStatus(booking._id, 'confirmed');

        return booking;
    }

    async addTimelineEvent(bookingId, title, description, updatedBy) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        booking.timeline.push({
            title,
            description,
            updatedBy
        });

        // Optional: If timeline event title suggests trip completion
        if (title.toLowerCase() === 'trip completed' || title.toLowerCase() === 'booking completed') {
            booking.status = 'completed';
        }

        await booking.save();
        return booking.timeline;
    }

    async raiseDispute(bookingId, userId, payload) {
        const { reason, description, evidenceUrls } = payload;
        
        const booking = await Booking.findOne({ _id: bookingId, user: userId })
            .populate('package', 'vendor');
        
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);
        if (['pending', 'cancelled'].includes(booking.status)) {
            throw new Error('Disputes can only be raised for confirmed or completed bookings.');
        }

        const existingDispute = await Dispute.findOne({ bookingId, raisedBy: userId, status: { $in: ['open', 'investigating'] } });
        if (existingDispute) {
            throw new Error('An active dispute already exists for this booking.');
        }

        const dispute = await Dispute.create({
            bookingId,
            raisedBy: userId,
            vendorId: booking.package.vendor,
            reason,
            description,
            evidenceUrls: evidenceUrls || []
        });

        // Set isDisputed on booking to block payouts
        booking.isDisputed = true;
        booking.timeline.push({
            title: 'Dispute Raised',
            description: `Reason: ${reason}. Vendor payout on hold.`,
            updatedBy: userId
        });
        await booking.save();

        return dispute;
    }
}

const bookingService = new BookingService();
export default bookingService;