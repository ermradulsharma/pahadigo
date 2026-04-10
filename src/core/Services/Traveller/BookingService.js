import mongoose from 'mongoose';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import Dispute from '@/models/Dispute.js';

import NotificationService from '@/services/General/NotificationService.js';
import InventoryService from './InventoryService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * BookingService (Traveller Role)
 * Specialized for customer reservations and post-booking operations.
 */
class BookingService {
    async initiateBooking({ userId, catalogId, category, itemId, travelDate, price, slots = 1 }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // 1. Fetch Package to get vendor context
            const pkg = await Package.findById(catalogId);
            if (!pkg) throw new Error("Package not found.");
            
            const vendorId = pkg.vendor.toString();

            // 2. Check Inventory Availability
            const availability = await InventoryService.checkAvailabilityRange(
                vendorId, 
                itemId, 
                category, 
                travelDate, 
                travelDate, 
                slots
            );

            if (!availability.available) {
                throw new Error("Requested slots are not available for this date.");
            }

            // 3. Mark Inventory
            await InventoryService.reserveSlotsRange(
                vendorId, 
                itemId, 
                category, 
                travelDate, 
                travelDate, 
                slots
            );

            // 4. Create Booking
            const booking = await Booking.create([{
                user: userId,
                package: catalogId,
                vendor: vendorId,
                travelStartTime: travelDate,
                travelEndTime: travelDate,
                units: slots,
                totalPrice: price * slots,
                status: 'pending',
                paymentStatus: 'pending',
                preferences: { category, itemId, slots },
                timeline: [{
                    title: 'Booking Requested',
                    description: `Request for ${slots} slots.`,
                    updatedBy: userId
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
                title: 'Booking Cancelled',
                description: `Refund of ₹${booking.totalPrice} processed.`,
                updatedBy: req?.user?.id
            });
            await booking.save({ session });

            // Release Inventory
            const catalog = await Package.findById(booking.package);
            if (catalog && booking.preferences?.category && booking.preferences?.itemId) {
                await InventoryService.releaseSlotsRange(
                    catalog.vendor.toString(),
                    booking.preferences.itemId,
                    booking.preferences.category,
                    booking.travelStartTime,
                    booking.travelEndTime,
                    booking.preferences.slots || 1
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
            raisedBy: userId,
            vendorId: booking.package.vendor,
            reason,
            description,
            evidenceUrls: evidenceUrls || []
        });

        booking.isDisputed = true;
        booking.timeline.push({
            title: 'Dispute Raised',
            description: `Reason: ${reason}.`,
            updatedBy: userId
        });
        await booking.save();

        return dispute;
    }
}

export default new BookingService();
