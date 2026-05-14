import mongoose from 'mongoose';
import Booking from '@/core/Models/Booking.js';
import Package from '@/core/Models/Package.js';
import User from '@/core/Models/User.js';
import Dispute from '@/core/Models/Dispute.js';
import Coupon from '@/core/Models/Coupon.js';

import NotificationService from '@/core/Services/General/NotificationService.js';
import RazorpayService from '@/core/Services/General/RazorpayService.js';
import PackageService from '@/core/Services/Traveller/PackageService.js';
import InventoryService from '@/core/Services/Traveller/InventoryService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { RESPONSE_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS, REFUND_STATUS } from '@/core/Constants/index.js';

/**
 * BookingService (Traveller Role)
 * Specialized for customer reservations and post-booking operations.
 */
class BookingService {
  async initiateBooking({ userId, body, itemId }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const config = await getAppConfig();
      const checkInDate = new Date(body.startDate);
      const checkOutDate = new Date(body.endDate || body.startDate);

      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new Error("Invalid startDate or endDate format. Use YYYY-MM-DD.");
      }

      const packageItem = await PackageService.getAvailablePackageItem(itemId);
      if (!packageItem) throw new Error(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

      const travellerProfile = await User.findById(userId);
      if (!travellerProfile) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);

      const { catalogId, category, vendor } = packageItem;
      const pricingRules = packageItem.pricing || {};

      const adultsCount = parseInt(body.adults) || 1;
      const childrenCount = parseInt(body.children) || 0;
      const isSelfIncluded = body.includeMe === 'true' || body.includeMe === true;
      const guestDetails = body.guestDetails || [];

      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const totalNights = Math.max(1, Math.round(timeDiff / (1000 * 60 * 60 * 24)));

      let calculatedSubTotal = 0;
      let requiredUnits = 1;
      let baseItemRate = 0;

      const STAY_CATEGORIES = ['homestay', 'hotel', 'camping'];
      const ACTIVITY_CATEGORIES = ['trekking', 'rafting', 'bungeeJumping'];
      const RENTAL_CATEGORIES = ['bike-scooter-rental', 'chardham-tour', 'vehicleRental', 'chardhamTour'];

      if (STAY_CATEGORIES.includes(category)) {
        baseItemRate = pricingRules.sellingPrice || 0;

        if (category === 'homestay') {
          requiredUnits = 1;
        } else {
          const maxCapacityPerUnit = parseInt(pricingRules.maxAdults) > 0 ? parseInt(pricingRules.maxAdults) : 2;
          requiredUnits = Math.max(1, Math.ceil(adultsCount / maxCapacityPerUnit));
        }
        calculatedSubTotal = baseItemRate * totalNights * requiredUnits;
      } else if (ACTIVITY_CATEGORIES.includes(category)) {
        baseItemRate = pricingRules.sellingPrice || 0;
        const childRate = pricingRules.childPrice || baseItemRate;

        calculatedSubTotal = (baseItemRate * adultsCount) + (childRate * childrenCount);
        requiredUnits = adultsCount + childrenCount;
      } else {
        baseItemRate = pricingRules.sellingPrice || 0;
        requiredUnits = 1;
        const isRentalOrTour = RENTAL_CATEGORIES.includes(category);
        const durationMultiplier = isRentalOrTour ? totalNights : 1;
        calculatedSubTotal = baseItemRate * requiredUnits * durationMultiplier;
      }
      const availabilityStatus = await InventoryService.checkAvailabilityRange(
        vendor.id, itemId, category, checkInDate, checkOutDate, requiredUnits
      );

      if (!availabilityStatus.available) {
        throw new Error(RESPONSE_MESSAGES.BOOKING.SLOTS_NOT_AVAILABLE);
      }

      const baseAmount = pricingRules.basePrice;
      let d = pricingRules.discountType;
      let discountAmount = 0;
      if (d === "percentage") {
        discountAmount = baseAmount * ((pricingRules.discount || 0) / 100);
      } else if (d === "flat") {
        discountAmount = pricingRules.discount || 0;
      }

      let tax = 0;
      if (pricingRules.gst) {
        tax = pricingRules.basePrice * (pricingRules.gst / 100);
      }

      let serviceFee = 0;
      if (pricingRules.serviceTax) {
        const baseServiceFee = pricingRules.sellingPrice * (pricingRules.serviceTax / 100);
        const gstOnServiceFee = baseServiceFee * ((config.tax?.gst || 18) / 100);
        serviceFee = baseServiceFee + gstOnServiceFee;
      }

      const appliedDiscount = discountAmount;
      const appliedCouponCode = null;
      const appliedCouponAmount = 0;
      const appliedServiceFee = serviceFee;
      const appliedTaxRate = pricingRules.gst || 0;
      const calculatedTax = tax;

      const grandTotal = calculatedSubTotal;

      const bookingCode = `PH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expirationTime = new Date(Date.now() + 15 * 60 * 1000);

      const [newBooking] = await Booking.create([{
        bookingCode,
        user: userId,
        vendor: vendor.id,
        package: catalogId,
        expiresAt: expirationTime,
        item: { itemId: itemId, itemType: category, title: packageItem.title || packageItem.name },
        traveller: { name: travellerProfile.name, phone: travellerProfile.phone, email: travellerProfile.email },
        startDate: checkInDate,
        endDate: checkOutDate,
        occupancy: {
          adults: adultsCount,
          children: childrenCount,
          includeMe: isSelfIncluded,
          guestDetails,
          units: requiredUnits
        },
        pricing: {
          basePrice: baseAmount,
          subTotal: calculatedSubTotal,
          serviceFee: appliedServiceFee,
          discount: appliedDiscount,
          coupon: appliedCouponCode,
          couponAmount: Math.round(appliedCouponAmount),
          taxRate: appliedTaxRate,
          tax: calculatedTax,
          total: grandTotal
        },
        status: BOOKING_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        timeline: [{
          status: 'Booking Initiated',
          remarks: `Booking record ${bookingCode} created for ${requiredUnits} units. Awaiting payment.`,
          actor: userId
        }]
      }], { session });

      // Verification check within the same transaction to prevent race conditions
      const finalCheck = await InventoryService.checkAvailabilityRange(
        vendor.id, itemId, category, checkInDate, checkOutDate, requiredUnits, session, newBooking._id
      );
      if (!finalCheck.available) {
        throw new Error(`Inventory Conflict: Slots became unavailable.`);
      }

      await session.commitTransaction();
      NotificationService.notifyBookingStatus(newBooking._id, 'created');
      return newBooking;
    } catch (error) {
      await session.abortTransaction();
      throw new Error(error.message || 'Booking failed');
    } finally {
      session.endSession();
    }
  }

  /**
   * Separate API to get payment details for a booking
   */
  async initializePayment(bookingId, userId) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new Error(`Payment not allowed. Booking status is ${booking.status}.`);
    }

    if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new Error("This booking is already paid.");
    }

    const config = await getAppConfig();

    // Create Razorpay Order
    const razorpayOrder = await RazorpayService.createOrder(
      booking.pricing.total,
      booking.bookingCode,
      config.razorpay
    );

    // Update Booking with Order ID and mark attempt
    booking.payment.gateway = 'razorpay';
    booking.payment.orderId = razorpayOrder.id;

    booking.timeline.push({
      status: 'Payment Attempted',
      remarks: `Razorpay Order ${razorpayOrder.id} generated.`,
      actor: userId
    });

    await booking.save();

    return {
      orderId: razorpayOrder.id,
      amount: booking.pricing.total,
      currency: 'INR',
      bookingCode: booking.bookingCode
    };
  }

  /**
   * Verify payment and generate Start/End OTPs
   */
  async verifyBookingPayment(bookingId, userId, paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

    // 1. Verify Razorpay Signature
    const config = await getAppConfig();

    // DEVELOPMENT BYPASS: Allow dummy signature for testing in dev mode
    const isDev = process.env.NODE_ENV === 'development';
    const isDummy = razorpay_signature === 'DUMMY_SIGNATURE';

    if (!(isDev && isDummy)) {
      const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, config.razorpay);
      if (!isValid) throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_SIGNATURE);
    }

    // If already confirmed, don't redo
    if (booking.status === BOOKING_STATUS.CONFIRMED) return booking;

    // 2. Generate OTPs (6-digit) for Access
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

    booking.verification.startOTP = generateOTP();
    booking.verification.endOTP = generateOTP();

    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.paymentStatus = PAYMENT_STATUS.PAID;

    // Increment Coupon Usage Count
    if (booking.pricing.coupon) {
      await Coupon.findOneAndUpdate(
        { code: booking.pricing.coupon.toUpperCase() },
        { $inc: { usedCount: 1 } },
        { returnDocument: 'after' }
      );
    }

    booking.payment.paymentId = razorpay_payment_id;
    booking.payment.signature = razorpay_signature;
    booking.payment.paidAt = new Date();

    booking.timeline.push({
      status: 'Payment Verified',
      remarks: `Payment ₹${booking.pricing.total} verified successfully. Access OTPs generated.`,
      actor: userId
    });

    await booking.save();

    // 3. Notify Traveller & Vendor
    NotificationService.notifyBookingStatus(booking._id, 'confirmed');

    return booking;
  }

  /**
   * Reveal appropriate OTP (Start or End) based on booking status
   */
  async getBookingOTP(bookingId, userId) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      throw new Error("Trip is already completed. No OTPs available.");
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new Error("This booking has been cancelled.");
    }
    let otpType = '';
    let otpValue = '';
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      otpType = 'Start OTP';
      otpValue = booking.verification.startOTP;

      const today = new Date().setHours(0, 0, 0, 0);
      const startDate = new Date(booking.startDate).setHours(0, 0, 0, 0);
      if (today < startDate) {
        throw new Error(`Start OTP will be available on ${new Date(booking.startDate).toDateString()}`);
      }
    } else if (booking.status === BOOKING_STATUS.ONGOING) {
      otpType = 'End OTP';
      otpValue = booking.verification.endOTP;
    } else {
      throw new Error(`OTP not available for current status: ${booking.status}`);
    }
    NotificationService.notifyBookingStatus(booking._id, 'otp_sent');
    return { type: otpType, otp: otpValue };
  }

  /**
   * Start the booking (Check-in via OTP)
   */
  async startBooking(bookingId, userId, otp) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new Error(`Cannot start booking in ${booking.status} status.`);
    }

    if (booking.verification.startOTP !== otp) {
      throw new Error("Invalid Start OTP.");
    }

    booking.status = BOOKING_STATUS.ONGOING;
    booking.verification.isStartVerified = true;
    booking.verification.startVerifiedAt = new Date();

    booking.timeline.push({
      status: 'Trip Started',
      remarks: 'Check-in verified via Start OTP.',
      actor: userId
    });

    await booking.save();
    NotificationService.notifyBookingStatus(booking._id, 'ongoing');
    return booking;
  }

  /**
   * Complete the booking (Check-out via OTP)
   */
  async completeBooking(bookingId, userId, otp) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND_OR_UNAUTHORIZED);

    if (booking.status !== BOOKING_STATUS.ONGOING) {
      throw new Error(`Cannot complete booking in ${booking.status} status.`);
    }

    if (booking.verification.endOTP !== otp) {
      throw new Error("Invalid End OTP.");
    }

    booking.status = BOOKING_STATUS.COMPLETED;
    booking.verification.isEndVerified = true;
    booking.verification.endVerifiedAt = new Date();

    booking.timeline.push({
      status: 'Trip Completed',
      remarks: 'Check-out verified via End OTP.',
      actor: userId
    });

    await booking.save();
    NotificationService.notifyBookingStatus(booking._id, 'completed');
    return booking;
  }

  /**
   * Process refund and cancel booking
   */
  async refundBooking(bookingId, req = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

      booking.status = BOOKING_STATUS.CANCELLED;
      booking.paymentStatus = PAYMENT_STATUS.REFUND_PENDING;

      booking.cancellation = {
        reason: req?.body?.reason || 'Cancelled by User',
        date: new Date(),
        actor: req?.user?.id
      };

      booking.timeline.push({
        status: 'Booking Cancelled',
        remarks: `Refund of ₹${booking.pricing.totalPrice} processed.`,
        actor: req?.user?.id
      });
      await booking.save({ session });

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
    let { reason, description, evidenceUrls } = payload;

    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw new Error(RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

    // Map reason to allowed enum if strictly necessary, or ensure user sends correct ones
    const validReasons = ['vendor_no_show', 'quality_issue', 'safety_concern', 'wrong_information', 'other'];
    if (!validReasons.includes(reason)) {
      // Map common phrases
      if (reason.toLowerCase().includes('not clean') || reason.toLowerCase().includes('quality')) reason = 'quality_issue';
      else if (reason.toLowerCase().includes('different') || reason.toLowerCase().includes('wrong')) reason = 'wrong_information';
      else reason = 'other';
    }

    const dispute = await Dispute.create({
      bookingId,
      user: userId,
      traveller: userId, // Required by model
      vendor: booking.vendor,
      reason,
      description,
      evidenceUrls: (evidenceUrls || []).map(url => (typeof url === 'string' ? { url } : url))
    });

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

