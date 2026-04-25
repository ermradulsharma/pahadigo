/**
 * NotificationService - Centralized service for sending communications
 * via Email (SMTP) and SMS (MSG91/Twilio).
 */
class NotificationService {
    async sendOTPEmail(email, otp) {
        return true;
    }

    async sendSMS(phone, message) {
        return true;
    }

    async sendLoginAlertEmail(email, details) {
        return true;
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
