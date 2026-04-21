import mongoose from 'mongoose';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import Dispute from '@/models/Dispute.js';

import NotificationService from '@/services/General/NotificationService.js';
import RazorpayService from '@/services/General/RazorpayService.js';
import InventoryService from './InventoryService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * BookingService (Traveller Role)
 * Specialized for customer reservations and post-booking operations.
 */
class BookingService {
    async initiateBooking({ userId, catalogId, category, itemId, startDate, endDate, totalTravellers, price }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // 1. Fetch Package to get vendor context
            const pkg = await Package.findById(catalogId);
            if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

            const vendorId = pkg.vendor.toString();

            const start = new Date(startDate);
            const end = new Date(endDate || startDate);

            // 2. Check Inventory Availability
            const availability = await InventoryService.checkAvailabilityRange(
                vendorId,
                itemId,
                category,
                start,
                end,
                totalTravellers
            );

            if (!availability.available) {
                throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);
            }

            // 3. Create Razorpay Order
            const amount = price * totalTravellers;
            const razorpayOrder = await RazorpayService.createOrder(amount, `receipt#${Date.now()}`);

            // 4. Mark Inventory (Temporary Hold)
            await InventoryService.reserveSlotsRange(
                vendorId,
                itemId,
                category,
                start,
                end,
                totalTravellers
            );

            // 5. Create Booking
            const booking = await Booking.create([{
                user: userId,
                traveller: userId,
                package: catalogId,
                vendor: vendorId,
                startDate: start,
                endDate: end,
                totalTravellers,
                basePrice: price,
                totalPrice: amount,
                status: 'pending',
                paymentStatus: 'unpaid',
                bookingDetails: { category, itemId, itemTitle: '' },
                paymentGateway: {
                    name: 'razorpay',
                    orderId: razorpayOrder.id
                },
                timeline: [{
                    status: 'Booking Initiated',
                    remarks: `Razorpay Order: ${razorpayOrder.id} created for ${totalTravellers} traveller(s).`,
                    actor: userId
                }]
            }], { session });

            await session.commitTransaction();
            NotificationService.notifyBookingStatus(booking[0]._id, 'created');
            return booking[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async refundBooking(bookingId, req = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

            booking.status = 'cancelled';
            booking.refundStatus = 'refunded';
            booking.refundAmount = booking.totalPrice;
            booking.timeline.push({
                status: 'Booking Cancelled',
                remarks: `Refund of ₹${booking.totalPrice} processed.`,
                actor: req?.user?.id
            });
            await booking.save({ session });

            // Release Inventory
            const catalog = await Package.findById(booking.package);
            if (catalog && booking.bookingDetails?.category && booking.bookingDetails?.itemId) {
                await InventoryService.releaseSlotsRange(
                    catalog.vendor.toString(),
                    booking.bookingDetails.itemId,
                    booking.bookingDetails.category,
                    booking.startDate,
                    booking.endDate,
                    booking.totalTravellers || 1
                );
            }

            await session.commitTransaction();
            NotificationService.notifyBookingStatus(bookingId, 'cancelled');
            return booking;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async reportDispute(bookingId, userId, payload) {
        const { reason, description, evidenceUrls } = payload;
        const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate('package', 'vendor');
        if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

        const dispute = await Dispute.create({
            bookingId,
            user: userId,
            traveller: userId,
            vendor: booking.package.vendor,
            reason,
            description,
            evidenceUrls: (evidenceUrls || []).map(url => ({ url }))
        });

        booking.isDisputed = true;
        booking.timeline.push({
            status: 'Dispute Raised',
            remarks: `Reason: ${reason}.`,
            actor: userId
        });
        await booking.save();

        return dispute;
    }
}

export default new BookingService();
