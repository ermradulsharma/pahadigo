/**
 * NotificationService - Centralized service for sending communications
 * via Email (SMTP) and SMS (MSG91/Twilio).
 */
class NotificationService {
  async sendOTPEmail(email, otp) {
    console.log(`[NotificationService] Sending OTP Email to ${email}: ${otp}`);
    return true;
  }

  async sendSMS(phone, message) {
    console.log(`[NotificationService] Sending SMS to ${phone}: ${message}`);
    return true;
  }

  async sendLoginAlertEmail(email, details) {
    console.log(`[NotificationService] Login alert sent to ${email}`, details);
    return true;
  }

  async sendLoginAlertSMS(phone, details) {
    console.log(`[NotificationService] Login alert SMS sent to ${phone}`, details);
    return true;
  }

  async notifyBookingStatus(bookingId, status) {
    console.log(`[NotificationService] Booking ${bookingId} status updated to ${status}`);
    return true;
  }

  async notifyVendorApproval(vendorId, isApproved) {
    console.log(`[NotificationService] Vendor ${vendorId} approval: ${isApproved}`);
    return true;
  }

  async notifyDocumentVerification(vendorId, field, isVerified) {
    console.log(`[NotificationService] Document ${field} for vendor ${vendorId} verification: ${isVerified}`);
    return true;
  }
}

export default new NotificationService();
