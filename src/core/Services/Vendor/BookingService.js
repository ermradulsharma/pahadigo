import mongoose from 'mongoose';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import NotificationService from '@/services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

class BookingService {
  /**
   * Fetch bookings belonging to a specific vendor's catalog
   */
  async getVendorBookings(vendorId) {
    const catalog = await Package.findOne({ vendor: vendorId });
    if (!catalog) return [];

    return await Booking.find({ package: catalog._id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
  }

  /**
   * Retrieve a single booking by ID
   */
  async getBookingById(bookingId) {
    return await Booking.findById(bookingId).populate('user', 'name email phone').populate('package', 'title');
  }

  /**
   * Update operational status of a booking (Industry Standard)
   */
  async updateBookingStatus(bookingId, vendorId, status) {
    const booking = await Booking.findOne({ _id: bookingId, vendor: vendorId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

    booking.status = status;
    booking.timeline.push({
      title: 'Status Updated',
      description: `Booking status changed to ${status}`,
      updatedBy: vendorId
    });

    await booking.save();
    NotificationService.notifyBookingStatus(bookingId, status);
    return booking;
  }

  /**
   * Log a timeline event for a booking (Industry Standard)
   */
  async logTimelineEvent(bookingId, title, description, updatedBy) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

    booking.timeline.push({
      title,
      description,
      updatedBy
    });

    if (title.toLowerCase() === 'trip completed' || title.toLowerCase() === 'booking completed') {
      booking.status = 'completed';
    }

    await booking.save();
    return booking.timeline;
  }
}

export default new BookingService();
