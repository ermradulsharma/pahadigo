import { randomBytes } from 'node:crypto';
import Booking from '@/core/Models/Booking.js';
import Dispute from '@/core/Models/Dispute.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import RazorpayService from '@/core/Services/General/RazorpayService.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { PAYMENT_STATUS, BOOKING_STATUS, REFUND_STATUS, HTTP_STATUS } from '@/core/Constants/index.js';
import mongoose from 'mongoose';

/**
 * BookingService (Admin Role)
 * Administration of system-wide reservations, dispute resolution, and payouts.
 */
class BookingService {

    async invalidateBookingCaches(bookingId = null) {
        await CacheService.del('admin:bookings:all');
        await CacheService.del('admin:disputes:all');
        if (bookingId) {
            await CacheService.del(`admin:bookings:${bookingId}`);
        }
    }

    async getAllBookings(filter = {}, page = 1, limit = 10) {
        const query = {};
        if (filter.status && filter.status !== 'all') query.status = filter.status;

        // Simple cache key based on query params
        const cacheKey = `admin:bookings:all:${JSON.stringify(filter)}:${page}:${limit}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate('vendor', 'businessName ownerName businessEmail')
            .populate('package', 'title price')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const result = { bookings, total, totalPages: Math.ceil(total / limit) };
        await CacheService.set(cacheKey, result, 1800); // 30 mins
        return result;
    }

    async getBookingById(id) {
        const cacheKey = `admin:bookings:${id}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const booking = await Booking.findById(id)
            .populate('user', 'name email phone address')
            .populate('vendor', 'businessName ownerName phone email businessEmail')
            .populate('package', 'title price')
            .lean();

        if (booking) await CacheService.set(cacheKey, booking, 1800);
        return booking;
    }

    async createBookingByAdmin(data, req = null) {
        const { user, vendor, packageId, item, startDate, endDate, occupancy, pricing, paymentStatus } = data;

        const generateCode = () => `B-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;

        let attempts = 0;
        const maxAttempts = 3;

        const session = await mongoose.startSession();
        let result = null;

        while (attempts < maxAttempts) {
            try {
                await session.withTransaction(async () => {
                    const bookingCode = generateCode();

                    const bookingData = {
                        bookingCode,
                        user,
                        vendor,
                        package: packageId,
                        item,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        occupancy: {
                            adults: occupancy?.adults || 1,
                            children: occupancy?.children || 0
                        },
                        pricing: {
                            basePrice: pricing?.basePrice || 0,
                            subTotal: pricing?.subTotal || 0,
                            total: pricing?.total || 0,
                            currency: 'INR'
                        },
                        status: BOOKING_STATUS.CONFIRMED, // Admin bypass
                        paymentStatus: paymentStatus || PAYMENT_STATUS.PAID,
                        adminNotes: 'Booking created manually by Administrator.'
                    };

                    if (paymentStatus === PAYMENT_STATUS.PAID) {
                        bookingData.payment = {
                            gateway: 'CASH_OFFLINE',
                            orderId: 'MANUAL_ADMIN',
                            paymentId: 'MANUAL_ADMIN_' + Date.now(),
                            paidAt: new Date()
                        };
                    }

                    const booking = await Booking.create([bookingData], { session });

                    if (req && req.user) {
                        await AuditService.logAction(req.user.id, 'CREATE_BOOKING', 'BOOKING', booking[0]._id, { bookingCode }, req);
                    }

                    result = booking[0];
                });

                if (result) break; // Success, exit retry loop
            } catch (err) {
                if (err.code === 11000 && err.message.includes('bookingCode')) {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        session.endSession();
                        throw new AppError('Unable to generate a unique booking code. Please try again.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
                    }
                } else {
                    session.endSession();
                    throw err;
                }
            }
        }

        session.endSession();
        await this.invalidateBookingCaches();
        return result;
    }

    async getPaymentHistory(filter = {}, page = 1, limit = 10) {
        const query = { paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] } };
        
        if (filter.search) {
            // Optional search by bookingCode
            query.bookingCode = { $regex: filter.search, $options: 'i' };
        }

        const total = await Booking.countDocuments(query);
        const payments = await Booking.find(query)
            .select('bookingCode user vendor item pricing payment status occupancy payout createdAt')
            .populate('user', 'name email')
            .populate('vendor', 'businessName ownerName businessEmail bankDetails')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return { payments, total, totalPages: Math.ceil(total / limit) };
    }

    async payoutBooking(data, req = null) {
        const { bookingId, amount, transactionId, note } = data;
        const session = await mongoose.startSession();
        let updatedBooking = null;

        await session.withTransaction(async () => {
            const booking = await Booking.findById(bookingId).populate('vendor').session(session).lean();
            if (!booking) throw new AppError("Booking Node Not Found", HTTP_STATUS.NOT_FOUND);

            const settlementAmount = amount || booking.pricing?.basePrice || 0;

            const snapshot = {
                'payout.status': 'paid',
                'payout.paidAt': new Date(),
                'payout.transactionId': transactionId || `MANUAL_SETTLE_${Date.now()}`,
                'payout.amount': settlementAmount,
                'payout.businessName': booking.vendor?.businessName,
                'payout.ownerName': booking.vendor?.ownerName,
                'payout.bankDetails': {
                    accountHolderName: booking.vendor?.bankDetails?.accountHolderName,
                    accountNumber: booking.vendor?.bankDetails?.accountNumber,
                    ifscCode: booking.vendor?.bankDetails?.ifscCode,
                    bankName: booking.vendor?.bankDetails?.bankName
                },
                adminNotes: note
            };

            updatedBooking = await Booking.findByIdAndUpdate(bookingId, snapshot, { session, new: true, lean: true });

            if (req && req.user) {
                await AuditService.logAction(req.user.id, 'PAYOUT', 'BOOKING', bookingId, { amount, transactionId }, req);
            }
        });

        session.endSession();
        await this.invalidateBookingCaches(bookingId);
        return updatedBooking;
    }

    async refundBooking(data, req = null) {
        const { bookingId, amount, reason } = data;
        let refundResponse = null;
        let booking = null;

        // Fetch first to validate (outside transaction to avoid blocking during external API call)
        booking = await Booking.findById(bookingId).lean();
        if (!booking) throw new AppError("Booking not found", HTTP_STATUS.NOT_FOUND);

        if (![PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUND_PENDING].includes(booking.paymentStatus.toLowerCase())) {
            throw new AppError("Only paid or refund-pending bookings can be refunded", HTTP_STATUS.BAD_REQUEST);
        }
        if (!booking.payment?.paymentId) throw new AppError("No payment ID found for this booking.", HTTP_STATUS.BAD_REQUEST);

        const config = await getAppConfig();
        const razorpayConfig = config?.razorpay;

        // External API Call (keep outside transaction)
        try {
            refundResponse = await RazorpayService.createRefund(booking.payment.paymentId, amount, razorpayConfig);
        } catch (err) {
            throw new AppError(`Refund Failed: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const updateData = {
                'pricing.refundStatus': REFUND_STATUS.REFUNDED,
                'pricing.refundAmount': amount,
                'pricing.refundDate': new Date(),
                'pricing.refundId': refundResponse.id,
                status: BOOKING_STATUS.CANCELLED,
                paymentStatus: PAYMENT_STATUS.REFUNDED,
                adminNotes: reason,
                $push: {
                    timeline: {
                        status: 'Fund Refunded',
                        remarks: `Admin processed refund of ₹${amount} via ${booking.payment.gateway}. Refund ID: ${refundResponse.id}`,
                        actor: req?.user?.id || null,
                        timestamp: new Date()
                    }
                }
            };

            booking = await Booking.findByIdAndUpdate(bookingId, updateData, { session, new: true, lean: true });

            if (req && req.user) {
                await AuditService.logAction(req.user.id, 'REFUND', 'BOOKING', bookingId, { amount, reason, refundId: refundResponse.id }, req);
            }
        });

        session.endSession();
        await this.invalidateBookingCaches(bookingId);
        return booking;
    }

    async getDisputes(filter = {}, page = 1, limit = 20) {
        const query = {};
        if (filter.status) query.status = filter.status;
        if (filter.vendorId) query.vendorId = filter.vendorId;

        const cacheKey = `admin:disputes:all:${JSON.stringify(filter)}:${page}:${limit}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const total = await Dispute.countDocuments(query);
        const disputes = await Dispute.find(query)
            .populate({
                path: 'bookingId',
                populate: [
                    { path: 'user', select: 'name email phone image' },
                    { path: 'vendor', populate: { path: 'user', select: 'name email phone' } }
                ]
            })
            .populate('user', 'name email phone image')
            .populate('traveller', 'name email phone image')
            .populate({
                path: 'vendor',
                populate: { path: 'user', select: 'name email phone' }
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const result = { disputes, total, totalPages: Math.ceil(total / limit) };
        await CacheService.set(cacheKey, result, 1800);
        return result;
    }

    async resolveDispute(adminId, disputeId, decision, adminNotes, req = null) {
        const session = await mongoose.startSession();
        let dispute = null;

        await session.withTransaction(async () => {
            dispute = await Dispute.findByIdAndUpdate(disputeId, {
                status: decision,
                adminNotes,
                resolvedAt: new Date(),
                resolvedBy: adminId
            }, { session, new: true, lean: true });

            if (!dispute) throw new AppError("Dispute not found", HTTP_STATUS.NOT_FOUND);

            if (req && req.user) {
                await AuditService.logAction(adminId, 'RESOLVE', 'DISPUTE', disputeId, { decision }, req);
            }
        });

        session.endSession();
        await CacheService.del('admin:disputes:all');
        return dispute;
    }

    async generateAndSendInvoice(id) {
        const session = await mongoose.startSession();
        let booking = null;

        await session.withTransaction(async () => {
            booking = await Booking.findById(id)
                .populate('user', 'email name')
                .populate('vendor', 'businessEmail businessName')
                .session(session);

            if (!booking) throw new AppError('Booking Node Not Found', HTTP_STATUS.NOT_FOUND);

            booking.timeline.push({
                status: 'Invoice Dispatched',
                remarks: `Official invoice generated and transmitted to traveller and vendor nodes via automated delivery systems.`,
                timestamp: new Date()
            });

            await booking.save({ session });
        });

        session.endSession();
        await this.invalidateBookingCaches(id);

        // Notify outside transaction
        if (booking.user?.email) {
            Promise.resolve(NotificationService.sendInvoice(booking.user.email, booking._id, 'TRAVELLER'))
                .catch(err => { });
        }
        if (booking.vendor?.businessEmail) {
            Promise.resolve(NotificationService.sendInvoice(booking.vendor.businessEmail, booking._id, 'VENDOR'))
                .catch(err => { });
        }

        return booking.toObject(); // convert mongoose doc to plain obj
    }
}

export default new BookingService();
