class OTPService {
  constructor() {
    this.otps = new Map(); // In-memory store for demo. Use Redis in production.
  }

  generateOTP(identifier, role) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Expires in 5 minutes
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otps.set(identifier, { otp, expiresAt, role });
    
    console.log(`[OTPService] Generated OTP for ${identifier} (Role: ${role}): ${otp}`);
    return otp;
  }

  verifyOTP(identifier, code) {
    const record = this.otps.get(identifier);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.otps.delete(identifier);
      return null;
    }

    if (record.otp === code) {
      this.otps.delete(identifier);
      return record; // Return the whole record (includes role)
    }
    return null;
  }
}

module.exports = new OTPService();
