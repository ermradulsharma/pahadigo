import nodemailer from 'nodemailer';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';
import Booking from '@/core/Models/Booking.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';

/**
 * NotificationService - Centralized service for sending communications
 * via Email (SMTP) and SMS (MSG91/Twilio).
 */
class NotificationService {
    /**
     * Internal helper to create a nodemailer transporter instance
     */
    async _getTransporter() {
        const config = await getAppConfig();
        return nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.port === 465, // true for 465, false for other ports
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
        });
    }

    /**
     * Send OTP verification email
     */
    async sendOTPEmail(email, otp) {
        try {
            const config = await getAppConfig();
            const html = await renderTemplate('Emails/auth-otp.html', { OTP: otp });
            const transporter = await this._getTransporter();
            await transporter.sendMail({
                from: `"${config.smtp.from_name}" <${config.smtp.from_address}>`,
                to: email,
                subject: `PahadiGo OTP Verification`,
                html: html,
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send SMS via MSG91/Twilio (Placeholder logic)
     */
    async sendSMS(phone, message) {
        try {
            // Implement SMS Gateway logic here (e.g., MSG91, Twilio)
            console.log(`[SMS SENT to ${phone}]: ${message}`);
            return true;
        } catch (error) {
            console.error("[NotificationService] sendSMS Error:", error);
            return false;
        }
    }

    /**
     * Send login alert email
     */
    async sendLoginAlertEmail(email, details) {
        try {
            const config = await getAppConfig();
            const html = await renderTemplate('Emails/login-alert.html', {
                DEVICE: details.device || 'Unknown Device',
                IP: details.ip || 'Unknown IP',
                TIME: details.time || new Date().toLocaleString()
            });

            const transporter = await this._getTransporter();
            await transporter.sendMail({
                from: `"${config.smtp.from_name}" <${config.smtp.from_address}>`,
                to: email,
                subject: `PahadiGo: New Login Alert`,
                html: html,
            });

            return true;
        } catch (error) {
            console.error("[NotificationService] sendLoginAlertEmail Error:", error);
            return false;
        }
    }

    async sendLoginAlertSMS(phone, details) {
        return true;
    }

    async notifyBookingStatus(bookingId, status) {
        try {
            const booking = await Booking.findById(bookingId).lean();
            if (!booking) return false;

            const travellerId = booking.user;
            const vendorDoc = await Vendor.findById(booking.vendor).select('user').lean();
            const vendorUserId = vendorDoc ? vendorDoc.user : null;

            const startDateStr = booking.startDate ? new Date(booking.startDate).toLocaleDateString() : '';

            let travellerTitle = '';
            let travellerBody = '';
            let vendorTitle = '';
            let vendorBody = '';

            const dataPayload = {
                bookingId: String(booking._id),
                bookingCode: booking.bookingCode,
                status: status
            };

            switch (status) {
                case 'created':
                    travellerTitle = 'Booking Initiated';
                    travellerBody = `Your booking for ${booking.item.title} has been initiated. Please complete the payment.`;
                    break;
                case 'confirmed':
                    travellerTitle = 'Booking Confirmed!';
                    travellerBody = `Your booking for ${booking.item.title} has been confirmed for ${startDateStr}.`;
                    vendorTitle = 'New Booking Confirmed!';
                    vendorBody = `You have a new booking for ${booking.item.title} starting on ${startDateStr}.`;
                    break;
                case 'ongoing':
                    travellerTitle = 'Trip Started!';
                    travellerBody = `Your trip for ${booking.item.title} has officially started. Enjoy your adventure!`;
                    vendorTitle = 'Trip Started';
                    vendorBody = `Booking ${booking.bookingCode} for ${booking.item.title} has started.`;
                    break;
                case 'completed':
                    travellerTitle = 'Trip Completed!';
                    travellerBody = `We hope you enjoyed ${booking.item.title}! Please share your feedback and rate your experience.`;
                    vendorTitle = 'Trip Completed';
                    vendorBody = `Booking ${booking.bookingCode} for ${booking.item.title} has been completed.`;
                    break;
                case 'cancelled':
                    travellerTitle = 'Booking Cancelled';
                    travellerBody = `Your booking for ${booking.item.title} has been cancelled successfully.`;
                    vendorTitle = 'Booking Cancelled';
                    vendorBody = `Booking ${booking.bookingCode} for ${booking.item.title} has been cancelled.`;
                    break;
                case 'otp_sent':
                    travellerTitle = 'Trip Verification OTP';
                    travellerBody = `Your OTP for checking into ${booking.item.title} is ready.`;
                    break;
            }

            // Dispatch to Traveler
            if (travellerTitle && travellerBody) {
                const travellerUser = await User.findById(travellerId).select('fcmToken').lean();
                if (travellerUser && travellerUser.fcmToken) {
                    await PushNotificationService.sendToDevice(
                        travellerUser.fcmToken,
                        { title: travellerTitle, body: travellerBody },
                        dataPayload
                    );
                }
            }

            // Dispatch to Vendor
            if (vendorUserId && vendorTitle && vendorBody) {
                const vendorUser = await User.findById(vendorUserId).select('fcmToken').lean();
                if (vendorUser && vendorUser.fcmToken) {
                    await PushNotificationService.sendToDevice(
                        vendorUser.fcmToken,
                        { title: vendorTitle, body: vendorBody },
                        dataPayload
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('[NotificationService] notifyBookingStatus Error:', error);
            return false;
        }
    }

    async notifyVendorApproval(vendorId, isApproved) {
        return true;
    }

    async notifyDocumentVerification(vendorId, field, isVerified) {
        return true;
    }

    async sendInvoice(email, bookingId, role) {
        return true;
    }
}

export default new NotificationService();
