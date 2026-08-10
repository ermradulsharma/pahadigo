import nodemailer from 'nodemailer';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';
import Booking from '@/core/Models/Booking.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import { enqueueInvoice, enqueuePushNotification } from '@/core/Lib/Queue/QueueService.js';

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
            const html = await renderTemplate('Emails/auth-otp.html', { OTP: otp });
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
            const html = await renderTemplate('Emails/login-alert.html', {
                DEVICE: details.device || 'Unknown Device',
                IP: details.ip || 'Unknown IP',
                TIME: details.time || new Date().toLocaleString()
            });
            await this._sendEmailHelper({ to: email, subject: `PahadiGo: New Login Alert`, html: html });
            return true;
        } catch (error) {
            console.error("[NotificationService] sendLoginAlertEmail Error:", error);
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
                console.log(`\n🔔 [Push Notification INTENDED for Traveller] Title: "${travellerTitle}" | Body: "${travellerBody}"`);
                const travellerUser = await User.findById(travellerId).select('fcmToken').lean();
                if (travellerUser && travellerUser.fcmToken) {
                    console.log(`=> 🚀 Enqueueing Push Notification to Traveller (FCM Token: ${travellerUser.fcmToken.substring(0, 15)}...)`);
                    await enqueuePushNotification(
                        travellerUser.fcmToken,
                        { title: travellerTitle, body: travellerBody },
                        dataPayload
                    );
                } else {
                    console.log('=> ⚠️ Skipped sending Push Notification to Traveller: FCM Token not found in user profile.');
                }
            }

            // Dispatch to Vendor
            if (vendorUserId && vendorTitle && vendorBody) {
                console.log(`\n🔔 [Push Notification INTENDED for Vendor] Title: "${vendorTitle}" | Body: "${vendorBody}"`);
                const vendorUser = await User.findById(vendorUserId).select('fcmToken').lean();
                if (vendorUser && vendorUser.fcmToken) {
                    console.log(`=> 🚀 Enqueueing Push Notification to Vendor (FCM Token: ${vendorUser.fcmToken.substring(0, 15)}...)`);
                    await enqueuePushNotification(
                        vendorUser.fcmToken,
                        { title: vendorTitle, body: vendorBody },
                        dataPayload
                    );
                } else {
                    console.log('=> ⚠️ Skipped sending Push Notification to Vendor: FCM Token not found in vendor profile.');
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

    async sendInvoice(email, bookingId, role = 'traveller') {
        try {
            // Offload the heavy PDF generation and email sending to the background queue
            await enqueueInvoice(email, bookingId, role);
            return true;
        } catch (error) {
            console.error('[NotificationService] Failed to enqueue sendInvoice:', error);
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

            console.log(`[NotificationService] Generating PDF stream for booking ${booking.bookingCode}...`);
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

            console.log(`[NotificationService] Invoice sent successfully to ${email}`);
            return true;
        } catch (error) {
            console.error('[NotificationService] sendInvoice Error:', error);
            return false;
        }
    }
}

export default new NotificationService();
