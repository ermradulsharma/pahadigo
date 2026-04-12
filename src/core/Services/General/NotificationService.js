/**
 * NotificationService - Centralized service for sending communications
 * via Email (SMTP) and SMS (MSG91/Twilio).
 */
class NotificationService {
    async sendOTPEmail(email, otp) {
        console.log(`[Email] Sending OTP ${otp} to ${email}`);
        // Integration logic for Nodemailer/SES goes here
        return true;
    }

    async sendSMS(phone, message) {
        console.log(`[SMS] Sending to ${phone}: ${message}`);
        // Integration logic for MSG91/Twilio goes here
        return true;
    }

    async sendLoginAlertEmail(email, details) {
        console.log(`[Email] Login alert for ${email} from ${details.ip}`);
        return true;
    }

    async sendLoginAlertSMS(phone, details) {
        console.log(`[SMS] Login alert for ${phone} from ${details.ip}`);
        return true;
    }

    async notifyBookingStatus(bookingId, status) {
        console.log(`[Notify] Booking ${bookingId} status changed to ${status}`);
        return true;
    }

    async notifyVendorApproval(vendorId, isApproved) {
        console.log(`[Notify] Vendor ${vendorId} approval status: ${isApproved ? 'Approved' : 'Rejected'}`);
        return true;
    }

    async notifyDocumentVerification(vendorId, field, isVerified) {
        console.log(`[Notify] Document ${field} for vendor ${vendorId} verification state: ${isVerified ? 'Verified' : 'Rejected'}`);
        return true;
    }
}

export default new NotificationService();
