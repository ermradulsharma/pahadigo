import nodemailer from 'nodemailer';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';

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
            const html = await renderTemplate('Emails/auth-otp.html', {
                OTP: otp
            });

            const transporter = await this._getTransporter();
            await transporter.sendMail({
                from: `"${config.smtp.from_name}" <${config.smtp.from_address}>`,
                to: email,
                subject: `PahadiGo OTP Verification`,
                html: html,
            });

            return true;
        } catch (error) {
            console.error("[NotificationService] sendOTPEmail Error:", error);
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
        return true;
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
