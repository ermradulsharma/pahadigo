import User from '@/models/User.js';
import Vendor from '@/models/Vendor.js';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import msg91 from 'msg91-api';
import { getAppConfig } from '@/lib/appConfig.js';

class NotificationService {
    /**
     * Notify Vendor when their account is approved or rejected by Admin.
     */
    async notifyVendorApproval(vendorId, isApproved) {
        try {
            const vendor = await Vendor.findById(vendorId).populate('user');
            if (!vendor || !vendor.user) return;

            const email = vendor.businessEmail || vendor.user.email;
            const phone = vendor.contactPhone || vendor.user.phone;
            const tokens = vendor.user.fcmTokens;

            const statusTxt = isApproved ? 'Approved' : 'Rejected';
            const subject = `Your Vendor Account is ${statusTxt}`;
            const msg = isApproved 
                ? `Congratulations ${vendor.businessName}! Your vendor profile has been approved. You can now publish packages.` 
                : `Hello ${vendor.businessName},\nYour vendor profile application has been rejected. Please contact support.`;

            if (email) await this.sendEmail(email, subject, msg);
            if (phone) await this.sendSMS(phone, msg);
            if (tokens?.length) await this.sendPushNotification(tokens, subject, msg, { type: 'vendor_approval' });

        } catch (error) {
            console.error("[NotificationService] notifyVendorApproval Error:", error);
        }
    }

    /**
     * Notify Vendor when a Payout is marked as paid.
     */
    async notifyPayout(bookingId) {
        try {
            const booking = await mongoose.model('Booking').findById(bookingId).populate('package');
            if (!booking) return;

            const vendorId = booking.vendor || booking.package?.vendor;
            const vendor = await Vendor.findById(vendorId).populate('user');
            if (!vendor) return;

            const email = vendor.businessEmail || vendor.user?.email;
            const phone = vendor.contactPhone || vendor.user?.phone;
            const tokens = vendor.user?.fcmTokens;

            const subject = `Payout Successful for Booking #${booking._id.toString().slice(-6)}`;
            const msg = `Hello ${vendor.businessName || 'Vendor'},\nThe payout of ₹${booking.totalPrice} for booking #${booking._id} has been transferred to your bank account successfully.`;

            if (email) await this.sendEmail(email, subject, msg);
            if (phone) await this.sendSMS(phone, msg);
            if (tokens?.length) await this.sendPushNotification(tokens, "Payout Received! 💰", msg, { type: 'payout', bookingId: booking._id.toString() });

        } catch (error) {
            console.error("[NotificationService] notifyPayout Error:", error);
        }
    }

    /**
     * Notify Vendor about Document Verification
     */
    async notifyDocumentVerification(vendorId, docType, isVerified) {
        try {
            const vendor = await Vendor.findById(vendorId).populate('user');
            if (!vendor) return;

            const email = vendor.businessEmail || vendor.user?.email;
            const phone = vendor.contactPhone || vendor.user?.phone;
            const tokens = vendor.user?.fcmTokens;

            const status = isVerified ? 'Verified' : 'Rejected';
            const subject = `Document ${status} - ${docType}`;
            const msg = `Hello,\nYour uploaded document (${docType}) has been ${status.toLowerCase()} by the admin.`;

            if (email) await this.sendEmail(email, subject, msg);
            if (phone) await this.sendSMS(phone, msg);
            if (tokens?.length) await this.sendPushNotification(tokens, subject, msg, { type: 'document_verification' });

        } catch (error) {
            console.error("[NotificationService] notifyDocumentVerification Error:", error);
        }
    }

    /**
     * Notify Admin and Vendor about a new or confirmed booking.
     */
    async notifyBookingStatus(bookingId, status = 'created') {
        try {
            // Populate necessary fields
            const booking = await mongoose.model('Booking').findById(bookingId).populate('package').populate('user');
            
            if (!booking) return;

            // Resolve Vendor
            let vendorId = booking.vendor;
            if (!vendorId && booking.package) {
                vendorId = booking.package.vendor;
            }
            
            const vendor = await Vendor.findById(vendorId).populate('user');
            const admins = await User.find({ role: 'admin' });

            const vendorEmail = vendor?.businessEmail || vendor?.user?.email;
            const vendorPhone = vendor?.contactPhone || vendor?.user?.phone;
            const adminEmails = admins.map(a => a.email).filter(Boolean);
            const adminPhones = admins.map(a => a.phone).filter(Boolean);

            const travellerEmail = booking.user?.email;
            const travellerPhone = booking.user?.phone;
            const travellerName = booking.user?.name || 'A Traveller';
            
            let subject = '';
            let message = '';

            if (status === 'created') {
                subject = `New Booking Initiated - #${booking._id.toString().slice(-6)}`;
                message = `Hello,\n\n${travellerName} has initiated a new booking. The payment is currently pending.\n\nBooking ID: ${booking._id}\nPackage: ${booking.package?.title}\nPrice: ₹${booking.totalPrice}`;
            } else if (status === 'confirmed') {
                subject = `Booking Confirmed! 🎉 - #${booking._id.toString().slice(-6)}`;
                message = `Hello,\n\nGreat news! The payment for booking #${booking._id} has been verified and the booking is now CONFIRMED.\n\nTraveller: ${travellerName}\nPackage: ${booking.package?.title}\nAmount Paid: ₹${booking.totalPrice}`;
            } else if (status === 'cancelled') {
                subject = `Booking Cancelled - #${booking._id.toString().slice(-6)}`;
                message = `Hello,\n\nThe booking #${booking._id} has been cancelled by ${travellerName}.`;
            }

            // --- 1. Notify Vendor ---
            if (vendorEmail) await this.sendEmail(vendorEmail, subject, message);
            if (vendorPhone) await this.sendSMS(vendorPhone, message);
            if (vendor?.user?.fcmTokens?.length) {
                await this.sendPushNotification(vendor.user.fcmTokens, subject, message, { type: 'booking', bookingId: booking._id.toString() });
            }

            // --- 2. Notify Admins ---
            for (const admin of admins) {
                if (admin.email) await this.sendEmail(admin.email, subject, message);
                if (admin.phone) await this.sendSMS(admin.phone, message);
                if (admin.fcmTokens?.length) {
                    await this.sendPushNotification(admin.fcmTokens, subject, message, { type: 'booking', bookingId: booking._id.toString() });
                }
            }

            // --- 3. Notify Traveller ---
            if (travellerEmail) {
                const trvSubject = status === 'confirmed' ? "Your Booking is Confirmed! 🎉" : subject;
                await this.sendEmail(travellerEmail, trvSubject, message);
            }
            if (travellerPhone) await this.sendSMS(travellerPhone, message);
            if (booking.user?.fcmTokens?.length) {
                const trvTitle = status === 'confirmed' ? "Booking Confirmed!" : subject;
                await this.sendPushNotification(booking.user.fcmTokens, trvTitle, message, { type: 'my_booking', bookingId: booking._id.toString() });
            }

            console.log(`[Notification] Booking ${status} notifications (Email, SMS, & Push) triggered successfully.`);

        } catch (error) {
            console.error("[NotificationService] Failed to send booking notification:", error);
        }
    }

    async sendEmail(to, subject, text) {
        if (!to) return;
        try {
            const config = (await getAppConfig()) || {};
            if (!config.smtp || !config.smtp.user) {
                console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
                return;
            }

            const transporter = nodemailer.createTransport({
                host: config.smtp.host,
                port: config.smtp.port,
                secure: false,
                auth: { user: config.smtp.user, pass: config.smtp.pass },
            });

            await transporter.sendMail({
                from: `"Travel Platform" <${config.smtp.from_address || config.smtp.user}>`,
                to,
                subject,
                text,
            });
        } catch (e) {
            console.error(`[NotificationService] SMTP Email Error to ${to}:`, e.message);
        }
    }

    /**
     * Send SMS Notification via MSG91
     */
    async sendSMS(phone, text) {
        if (!phone) return;
        try {
            const config = (await getAppConfig()) || {};
            // Assuming we use MSG91 for transactional SMS
            const { auth_key: authKey, template_id: templateId } = config.msg91 || {};

            if (!authKey) {
                console.log(`[MOCK SMS] To: ${phone} | Text: ${text}`);
                return;
            }

            // Using pure template ID logic or generic template for msg91-api if configured
            const msg91Func = msg91.default || msg91;
            const msg91Client = msg91Func(authKey);

            // This args structure depends heavily on your MSG91 template setup.
            // Some templates take raw 'message', others take 'var1', 'var2'. 
            // We'll pass both to be safe or use a generic structure.
            const args = {
                "flow_id": templateId, // Optional generic transactional template
                "sender": "PAHADI",
                "short_url": "0",
                "mobiles": phone.replace(/\D/g, ''), // Strip non-numeric
                "message": text, // Standard fallback
                "var": text.substring(0, 30) // Assuming template handles 'var' if needed
            };

            await new Promise((resolve, reject) => {
                msg91Client.send(args, (err, response) => {
                    if (err) return reject(err);
                    resolve(response);
                });
            });
        } catch (e) {
            console.error(`[NotificationService] SMS Error to ${phone}:`, e.message);
        }
    }

    /**
     * Send Push Notification to Mobile App via Firebase Cloud Messaging (FCM)
     */
    async sendPushNotification(tokens = [], title, body, data = {}) {
        if (!tokens || tokens.length === 0) return;

        try {
            // Check if Firebase is initialized in the project
            if (!admin.apps || admin.apps.length === 0) {
                console.log(`[MOCK PUSH] Firebase not initialized. Would send to ${tokens.length} devices. Title: ${title}`);
                return;
            }

            const message = {
                notification: { title, body },
                data: {
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard mobile handle
                    ...data
                },
                tokens: tokens // Send to multiple devices
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log(`[Push Notification] Sent successfully to ${response.successCount} devices. Failed: ${response.failureCount}`);
        } catch (e) {
            console.error(`[NotificationService] Push Notification Error:`, e.message);
        }
    }

    /**
     * Notify emergency contacts and admin about an SOS situation.
     * @param {Object} user - The user triggering SOS
     * @param {Object} alert - The EmergencyAlert document
     */
    async notifyEmergency(user, alert) {
        setImmediate(async () => {
             const message = `🚨 EMERGENCY (SOS) ALERT: ${user.name || 'User'} (${user.phone}) has triggered an SOS using our Travel App.\nLocation: ${alert.location?.latitude || 'Unknown'}, ${alert.location?.longitude || 'Unknown'}\nPlease try to contact them immediately.`;
             const subject = `🚨 URGENT: SOS Alert Triggered by ${user.name || 'User'}`;

             // Notify Emergency Contacts
             if (user.emergencyContacts && user.emergencyContacts.length > 0) {
                 for (const contact of user.emergencyContacts) {
                     if (contact.phone) await this.sendSMS(contact.phone, message);
                 }
             }

             // Notify Admins
             try {
                const admins = await User.find({ role: 'admin' });
                for (const admin of admins) {
                    if (admin.email) await this.sendEmail(admin.email, subject, message);
                    if (admin.phone) await this.sendSMS(admin.phone, message);
                    if (admin.fcmTokens?.length) {
                        await this.sendPushNotification(admin.fcmTokens, subject, message, { type: 'sos', alertId: alert._id.toString() });
                    }
                }
             } catch (e) {
                 console.error("Failed to notify admins of SOS:", e);
             }
        });
    }
}

const notificationService = new NotificationService();
export default notificationService;
