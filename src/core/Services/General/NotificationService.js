import nodemailer from 'nodemailer';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';
import Booking from '@/core/Models/Booking.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import { enqueueInvoice, enqueuePushNotification } from '@/core/Lib/Queue/QueueService.js';
import { getLogger } from '@/core/Lib/logger.js';

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
            secure: config.smtp.port === 465,
            auth: { user: config.smtp.user, pass: config.smtp.pass, },
        });
    }

    /**
     * Internal helper to send emails with standard configuration
     */
    async _sendEmailHelper({ to, toName, subject, html, attachments }) {
        const config = await getAppConfig();
        const transporter = await this._getTransporter();
        const toAddress = toName ? `"${toName}" <${to}>` : to;
        return await transporter.sendMail({
            from: `"${config.smtp.from_name}" <${config.smtp.from_address}>`,
            to: toAddress,
            subject,
            html,
            ...(attachments && { attachments })
        });
    }

    /**
     * Send OTP verification email
     */
    async sendOTPEmail(email, otp) {
        try {
            const html = await renderTemplate('Emails/otp.html', { OTP: otp });
            await this._sendEmailHelper({ to: email, subject: `PahadiGo OTP Verification`, html: html });
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
            getLogger().info({ phone }, `[SMS SENT]: ${message}`);
            return true;
        } catch (error) {
            getLogger().error({ err: error, phone }, "[NotificationService] sendSMS Error");
            return false;
        }
    }

    /**
     * Send login alert email
     */
    async sendLoginAlertEmail(email, details) {
        try {
            const config = await getAppConfig();
            const baseUrl = config?.app?.url || 'https://pahadigo.com';
            const securityUrl = `${baseUrl}/security`;
            const revokeUrl = details.sessionId ? `${baseUrl}/auth/revoke-session?id=${details.sessionId}` : `${baseUrl}/security`;

            const html = await renderTemplate('Emails/alert.html', {
                NAME: details.name,
                ACCOUNT_IDENTIFIER: details.accountIdentifier,
                AUTH_METHOD: details.authMethod,
                ROLE: details.role,
                DEVICE: details.summary,
                DEVICE_NAME: details.device,
                DEVICE_TYPE: details.deviceType,
                BROWSER: details.browser,
                OS: details.os,
                CARRIER: details.carrier,
                APP_VERSION: details.appVersion,
                IP: details.ip,
                LOCATION: details.location,
                DATACENTER: details.datacenter,
                TIME: details.loginTime,
                NEW_DEVICE_BADGE: Boolean(details.isNewDevice),
                SECURITY_URL: securityUrl,
                REVOKE_URL: revokeUrl
            });
            await this._sendEmailHelper({ to: email, subject: `PahadiGo Security Alert: New sign-in detected`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendLoginAlertEmail Error:", error);
            return false;
        }
    }

    /**
     * Send login alert SMS
     */
    async sendLoginAlertSMS(phone, details) {
        const message = `PahadiGo Alert: Your account was logged in from ${details.device} (${details.location}) at ${details.loginTime}. If this wasn't you, please secure your account.`;
        return await this.sendSMS(phone, message);
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(email, userData = {}) {
        try {
            const config = await getAppConfig();
            const exploreUrl = config?.app?.url ? `${config.app.url}/explore` : 'https://pahadigo.com/explore';
            const html = await renderTemplate('Emails/welcome.html', {
                NAME: userData.name || 'Traveler',
                ACCOUNT_IDENTIFIER: email,
                JOIN_DATE: new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
                EXPLORE_URL: exploreUrl
            });
            await this._sendEmailHelper({ to: email, subject: `Welcome to PahadiGo!`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendWelcomeEmail Error:", error);
            return false;
        }
    }

    /**
     * Send welcome email to vendor upon profile creation
     */
    async sendVendorWelcomeEmail(email, businessName) {
        try {
            const html = await renderTemplate('Emails/vendor/welcome.html', { BUSINESS_NAME: businessName });
            await this._sendEmailHelper({ to: email, toName: businessName, subject: `Welcome to PahadiGo!`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendVendorWelcomeEmail Error:", error);
            return false;
        }
    }

    /**
     * Send email to vendor acknowledging document upload
     */
    async sendVendorDocumentsReceivedEmail(email, businessName) {
        try {
            const html = await renderTemplate('Emails/vendor/documents.html', { BUSINESS_NAME: businessName });
            await this._sendEmailHelper({ to: email, toName: businessName, subject: `Documents Received - PahadiGo`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendVendorDocumentsReceivedEmail Error:", error);
            return false;
        }
    }

    /**
     * Send email to vendor acknowledging bank details submission
     */
    async sendVendorBankAddedEmail(email, businessName) {
        try {
            const html = await renderTemplate('Emails/vendor/bank.html', { BUSINESS_NAME: businessName });
            await this._sendEmailHelper({ to: email, toName: businessName, subject: `Bank Details Submitted - PahadiGo`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendVendorBankAddedEmail Error:", error);
            return false;
        }
    }

    /**
     * Send email to user acknowledging profile update
     */
    async sendUserProfileUpdatedEmail(email, userName) {
        try {
            const html = await renderTemplate('Emails/vendor/profile.html', { USER_NAME: userName });
            await this._sendEmailHelper({ to: email, toName: userName, subject: `Profile Updated - PahadiGo`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendUserProfileUpdatedEmail Error:", error);
            return false;
        }
    }

    /**
     * Send email to vendor acknowledging profile deletion
     */
    async sendVendorProfileDeletedEmail(email, businessName) {
        try {
            const html = `<p>Dear <strong>${businessName}</strong>,</p><p>Your vendor business profile on PahadiGo has been deleted successfully.</p><p>If this was not done by you, please contact support immediately.</p>`;
            await this._sendEmailHelper({ to: email, toName: businessName, subject: `Vendor Profile Deleted - PahadiGo`, html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendVendorProfileDeletedEmail Error:", error);
            return false;
        }
    }

    /**
     * Send email to vendor acknowledging operating status update
     */
    async sendVendorOperatingStatusUpdatedEmail(email, businessName, isOperating) {
        try {
            const statusText = isOperating ? 'ONLINE / OPERATING' : 'OFFLINE / CLOSED';
            const html = `<p>Dear <strong>${businessName}</strong>,</p><p>Your operational status on PahadiGo has been updated to <strong>${statusText}</strong>.</p>`;
            await this._sendEmailHelper({ to: email, toName: businessName, subject: `Operating Status Updated (${statusText}) - PahadiGo`, html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendVendorOperatingStatusUpdatedEmail Error:", error);
            return false;
        }
    }

    /**
     * Send welcome email for newsletter subscription
     */
    async sendNewsletterWelcomeEmail(email) {
        try {
            const html = await renderTemplate('Emails/newsletter.html', {});
            await this._sendEmailHelper({ to: email, subject: `Welcome to the PahadiGo Newsletter!`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendNewsletterWelcomeEmail Error:", error);
            return false;
        }
    }

    async sendLoginAlertSMS(phone, details) {
        return true;
    }

    async notifyBookingStatus(bookingId, status) {
        try {
            if (!bookingId) return false;

            let booking;
            try {
                booking = await Booking.findById(bookingId).lean();
            } catch (findErr) {
                return false;
            }
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
                getLogger().info({ travellerId, title: travellerTitle }, '[Push Notification INTENDED for Traveller]');
                const travellerUser = await User.findById(travellerId).select('fcmToken').lean();
                if (travellerUser && travellerUser.fcmToken) {
                    getLogger().info({ fcmToken: travellerUser.fcmToken.substring(0, 15) }, '=> Enqueueing Push Notification to Traveller');
                    await enqueuePushNotification(
                        travellerUser.fcmToken,
                        { title: travellerTitle, body: travellerBody },
                        dataPayload
                    );
                } else {
                    getLogger().warn('=> Skipped sending Push Notification to Traveller: FCM Token not found in user profile');
                }
            }

            // Dispatch to Vendor
            if (vendorUserId && vendorTitle && vendorBody) {
                getLogger().info({ vendorUserId, title: vendorTitle }, '[Push Notification INTENDED for Vendor]');
                const vendorUser = await User.findById(vendorUserId).select('fcmToken').lean();
                if (vendorUser && vendorUser.fcmToken) {
                    getLogger().info({ fcmToken: vendorUser.fcmToken.substring(0, 15) }, '=> Enqueueing Push Notification to Vendor');
                    await enqueuePushNotification(
                        vendorUser.fcmToken,
                        { title: vendorTitle, body: vendorBody },
                        dataPayload
                    );
                } else {
                    getLogger().warn('=> Skipped sending Push Notification to Vendor: FCM Token not found in vendor profile');
                }
            }

            return true;
        } catch (error) {
            getLogger().error({ err: error }, '[NotificationService] notifyBookingStatus Error');
            return false;
        }
    }

    async notifyVendorApproval(vendorId, isApproved) {
        return true;
    }

    async notifyDocumentVerification(vendorId, field, isVerified) {
        return true;
    }

    async sendInvoice(email, bookingId, role = 'traveller') {
        try {
            // Offload the heavy PDF generation and email sending to the background queue
            await enqueueInvoice(email, bookingId, role);
            return true;
        } catch (error) {
            getLogger().error({ err: error }, '[NotificationService] Failed to enqueue sendInvoice');
            return false;
        }
    }

    /**
     * Internal method called by the BullMQ worker to actually generate PDF and send the email
     */
    async _processInvoiceDelivery(email, bookingId, role = 'traveller') {
        try {
            const config = await getAppConfig();
            const booking = await Booking.findById(bookingId).populate('vendor user').lean();
            if (!booking) {
                console.error(`[NotificationService] Invoice generation failed: Booking ${bookingId} not found`);
                return false;
            }

            // Dynamically import to avoid Next.js Server Components issues on boot
            const { renderToStream } = await import('@react-pdf/renderer');
            const React = (await import('react')).default;
            const InvoiceDocument = (await import('@/core/Templates/Pdf/InvoiceDocument.jsx')).default;

            getLogger().info({ bookingCode: booking.bookingCode }, `[NotificationService] Generating PDF stream for booking...`);
            const stream = await renderToStream(React.createElement(InvoiceDocument, { booking }));

            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const pdfBuffer = Buffer.concat(chunks);

            await this._sendEmailHelper({
                to: email,
                subject: subject,
                html: `<p>Dear user,</p><p>Please find attached the invoice for your booking <strong>${booking.bookingCode}</strong>.</p><p>Thank you,<br/>PahadiGo Team</p>`,
                attachments: [
                    {
                        filename: `Invoice_${booking.bookingCode}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            });

            getLogger().info({ email, bookingCode: booking.bookingCode }, `[NotificationService] Invoice sent successfully`);
            return true;
        } catch (error) {
            getLogger().error({ err: error, email }, '[NotificationService] sendInvoice Error');
            return false;
        }
    }
}

export default new NotificationService();
