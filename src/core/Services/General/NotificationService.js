import nodemailer from 'nodemailer';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import { enqueueInvoice, enqueuePushNotification } from '@/core/Lib/Queue/QueueService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { getBookingById, getUserById, getBusinessById } from '@/core/Helpers/queryHelpers.js';
import { formatIST } from '@/core/Helpers/dateUtils.js';
import AppError from '@/core/Errors/AppError.js';

/**
 * NotificationService - Centralized service for sending communications
 * via Email (SMTP) and SMS (MSG91/Twilio).
 */
class NotificationService {
    constructor() {
        this._cachedTransporter = null;
        this._lastSmtpKey = null;
    }

    /**
     * Internal helper to create a nodemailer transporter instance
     * Automatically adapts for serverless (Vercel) vs persistent Node environments.
     */
    async _getTransporter(configParam = null) {
        const config = configParam || await getAppConfig();
        const host = config.smtp?.host;
        const port = Number(config.smtp?.port) || 587;
        const user = config.smtp?.user;
        const pass = config.smtp?.pass;
        const smtpKey = `${host}:${port}:${user}:${pass}`;

        // In serverless environments (Vercel / AWS Lambda), connection pooling causes stale, broken TCP sockets
        const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

        if (!isServerless && this._cachedTransporter && this._lastSmtpKey === smtpKey) return this._cachedTransporter;

        const isSecure = port === 465;

        const transporter = nodemailer.createTransport({
            pool: !isServerless,
            ...(!isServerless && {
                maxConnections: 5,
                maxMessages: 100,
            }),
            connectionTimeout: 15000, // 15s to allow cloud-to-SMTP handshakes
            greetingTimeout: 15000,
            socketTimeout: 20000,
            host,
            port,
            secure: isSecure,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            }
        });

        if (!isServerless) {
            this._cachedTransporter = transporter;
            this._lastSmtpKey = smtpKey;
        }

        return transporter;
    }

    /**
     * Internal helper to send emails with standard configuration
     */
    async _sendEmailHelper({ to, toName, subject, html, text, attachments }) {
        if (!to) throw AppError.badRequest("Recipient email address ('to') is required");

        const config = await getAppConfig();
        const transporter = await this._getTransporter(config);

        const isGmail = Boolean(config.smtp?.host && config.smtp.host.toLowerCase().includes('gmail'));
        const configuredFrom = config.smtp?.from_address || config.smtp?.from_email;
        // For Gmail SMTP, sending address must match authenticated user to avoid 550 relay/auth rejection.
        // Custom domain is retained in replyTo so user replies reach the official inbox.
        const fromAddress = (isGmail && config.smtp?.user) ? config.smtp.user : (configuredFrom || config.smtp?.user);
        const fromName = config.smtp?.from_name || 'PahadiGo';
        const replyToAddress = configuredFrom || fromAddress;

        const toRecipient = toName && typeof to === 'string' ? { name: toName, address: to } : to;
        const fromRecipient = fromAddress ? { name: fromName, address: fromAddress } : fromName;

        const plainText = text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : undefined);

        try {
            return await transporter.sendMail({
                from: fromRecipient,
                to: toRecipient,
                replyTo: replyToAddress ? { name: fromName, address: replyToAddress } : undefined,
                subject,
                html,
                ...(plainText && { text: plainText }),
                ...(attachments && { attachments })
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Send push notification directly via PushNotificationService
     */
    async sendPushNotification(token, notification, data = {}) {
        return await PushNotificationService.sendToDevice(token, notification, data);
    }

    /**
     * Send OTP verification email
     */
    async sendOTPEmail(email, otp) {
        try {
            const html = await renderTemplate('Emails/otp.html', { OTP: otp });
            await this._sendEmailHelper({ to: email, subject: 'OTP Verification Code', html: html });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send SMS via MSG91 REST API with graceful fallback to logger
     */
    async sendSMS(phone, message) {
        try {
            const config = await getAppConfig();
            const authKey = config?.msg91?.auth_key || config?.secrets?.msg91_auth_key;
            const templateId = config?.msg91?.template_id || config?.secrets?.msg91_template_id;

            const isRealKey = Boolean(authKey && !authKey.startsWith('your_') && authKey !== 'default' && authKey.length >= 10);

            if (isRealKey && phone) {
                const formattedPhone = phone.replace(/^\+/, '');
                const response = await fetch('https://control.msg91.com/api/v5/flow/', {
                    method: 'POST',
                    headers: {
                        'authkey': authKey,
                        'content-type': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000), // 5s timeout to prevent hanging
                    body: JSON.stringify({
                        template_id: templateId || 'default',
                        short_url: '0',
                        recipients: [{ mobiles: formattedPhone, message }]
                    })
                });
                await response.json();
                return response.ok;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send login alert email
     */
    async sendLoginAlertEmail(email, details) {
        try {
            const config = await getAppConfig();
            const baseUrl = config?.app?.url || 'https://pahadigo.co.in';
            const securityUrl = `${baseUrl}/security`;
            const revokeUrl = details.sessionId ? `${baseUrl}/auth/revoke-session?id=${details.sessionId}` : `${baseUrl}/security`;

            const html = await renderTemplate('Emails/alert.html', {
                NAME: details.name,
                ACCOUNT_IDENTIFIER: details.accountIdentifier,
                AUTH_METHOD: details.authMethod,
                ROLE: details.role,
                DEVICE: details.device,
                DEVICE_NAME: details.deviceName,
                DEVICE_TYPE: details.deviceType,
                BROWSER: details.browser,
                OS: details.os,
                CARRIER: details.carrier,
                IP: details.ip,
                LOCATION: details.location,
                DATACENTER: details.datacenter,
                TIME: details.loginTime,
                NEW_DEVICE_BADGE: Boolean(details.isNewDevice),
                APP_VERSION: details.appVersion,
                SECURITY_URL: securityUrl,
                REVOKE_URL: revokeUrl
            });
            await this._sendEmailHelper({ to: email, subject: 'Security Alert: New login detected', html: html });
            return true;
        } catch (error) {
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
            getLogger().error({ err: error }, "[NotificationService] sendWelcomeEmail Error");
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
            getLogger().error({ err: error }, "[NotificationService] sendVendorWelcomeEmail Error");
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
            getLogger().error({ err: error }, "[NotificationService] sendVendorDocumentsReceivedEmail Error");
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
            getLogger().error({ err: error }, "[NotificationService] sendVendorBankAddedEmail Error");
            return false;
        }
    }

    /**
     * Send email to user acknowledging profile update
     */
    async sendUserProfileUpdatedEmail(email, details) {
        try {
            const accountDetails = {
                USER_NAME: details?.name,
                BUSINESS_NAME: details?.businessProfile?.businessName,
                BUSINESS_OWNER_NAME: details?.businessProfile?.ownerName,
                BUSINESS_ADDRESS: details?.businessProfile?.address,
                BUSINESS_PHONE: details?.businessProfile?.businessNumber
            };
            const html = await renderTemplate('Emails/vendor/profile.html', accountDetails);
            await this._sendEmailHelper({ to: email, toName: details?.businessProfile?.businessName, subject: 'Update Business Profile', html: html });

            // Push Notification to vendor device using details.fcmToken
            if (details?.fcmToken) {
                const businessProfileId = details?.businessProfile?.id || details?.id || '';
                const profileImage = details?.businessProfile?.profileImage || details?.profileImage || null;

                await PushNotificationService.sendToDevice(
                    details.fcmToken,
                    {
                        title: 'Business Profile Updated!',
                        body: 'Your business profile has been successfully updated.',
                        ...(profileImage && { image: profileImage }),
                    },
                    {
                        type: 'profile_updated',
                        businessProfileId: String(businessProfileId)
                    }
                );
            } else {
                getLogger().debug({ email }, "[NotificationService] Skipped push notification: No fcmToken found in details");
            }

            return true;
        } catch (error) {
            getLogger().error({ err: error }, "[NotificationService] sendUserProfileUpdatedEmail Error");
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
            getLogger().error({ err: error }, "[NotificationService] sendVendorProfileDeletedEmail Error");
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
            getLogger().error({ err: error }, "[NotificationService] sendVendorOperatingStatusUpdatedEmail Error");
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
            getLogger().error({ err: error }, "[NotificationService] sendNewsletterWelcomeEmail Error");
            return false;
        }
    }


    async notifyBookingStatus(bookingId, status) {
        try {
            if (!bookingId) return false;

            let booking;
            try {
                booking = await getBookingById(bookingId);
            } catch (findErr) {
                return false;
            }
            if (!booking) return false;

            const travellerId = booking.user;

            // Parallel lookup of traveller User and vendor doc
            const [travellerUser, vendorDoc] = await Promise.all([
                travellerId ? getUserById(travellerId, 'fcmToken') : Promise.resolve(null),
                booking.vendor ? getBusinessById(booking.vendor, 'user') : Promise.resolve(null)
            ]);

            const vendorUserId = vendorDoc ? vendorDoc.user : null;
            const vendorUser = vendorUserId
                ? await getUserById(vendorUserId, 'fcmToken')
                : null;

            const startDateStr = booking.startDate ? formatIST(booking.startDate, { includeTime: false }) : '';

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
                    travellerBody = `Your booking for ${booking.item?.title || 'your trip'} has been initiated. Please complete the payment.`;
                    break;
                case 'confirmed':
                    travellerTitle = 'Booking Confirmed!';
                    travellerBody = `Your booking for ${booking.item?.title || 'your trip'} has been confirmed for ${startDateStr}.`;
                    vendorTitle = 'New Booking Confirmed!';
                    vendorBody = `You have a new booking for ${booking.item?.title || 'your trip'} starting on ${startDateStr}.`;
                    break;
                case 'ongoing':
                    travellerTitle = 'Trip Started!';
                    travellerBody = `Your trip for ${booking.item?.title || 'your trip'} has officially started. Enjoy your adventure!`;
                    vendorTitle = 'Trip Started';
                    vendorBody = `Booking ${booking.bookingCode} for ${booking.item?.title || 'your trip'} has started.`;
                    break;
                case 'completed':
                    travellerTitle = 'Trip Completed!';
                    travellerBody = `We hope you enjoyed ${booking.item?.title || 'your trip'}! Please share your feedback and rate your experience.`;
                    vendorTitle = 'Trip Completed';
                    vendorBody = `Booking ${booking.bookingCode} for ${booking.item?.title || 'your trip'} has been completed.`;
                    break;
                case 'cancelled':
                    travellerTitle = 'Booking Cancelled';
                    travellerBody = `Your booking for ${booking.item?.title || 'your trip'} has been cancelled successfully.`;
                    vendorTitle = 'Booking Cancelled';
                    vendorBody = `Booking ${booking.bookingCode} for ${booking.item?.title || 'your trip'} has been cancelled.`;
                    break;
                case 'otp_sent':
                    travellerTitle = 'Trip Verification OTP';
                    travellerBody = `Your OTP for checking into ${booking.item?.title || 'your trip'} is ready.`;
                    break;
            }

            // Dispatch push notifications to Traveller and Vendor in parallel
            const pushDispatches = [];

            if (travellerTitle && travellerBody) {
                getLogger().info({ travellerId, title: travellerTitle }, '[Push Notification INTENDED for Traveller]');
                if (travellerUser && travellerUser.fcmToken) {
                    getLogger().info({ fcmToken: travellerUser.fcmToken.substring(0, 15) }, '=> Enqueueing Push Notification to Traveller');
                    pushDispatches.push(
                        enqueuePushNotification(
                            travellerUser.fcmToken,
                            { title: travellerTitle, body: travellerBody },
                            dataPayload
                        )
                    );
                } else {
                    getLogger().warn('=> Skipped sending Push Notification to Traveller: FCM Token not found in user profile');
                }
            }

            if (vendorUserId && vendorTitle && vendorBody) {
                getLogger().info({ vendorUserId, title: vendorTitle }, '[Push Notification INTENDED for Vendor]');
                if (vendorUser && vendorUser.fcmToken) {
                    getLogger().info({ fcmToken: vendorUser.fcmToken.substring(0, 15) }, '=> Enqueueing Push Notification to Vendor');
                    pushDispatches.push(
                        enqueuePushNotification(
                            vendorUser.fcmToken,
                            { title: vendorTitle, body: vendorBody },
                            dataPayload
                        )
                    );
                } else {
                    getLogger().warn('=> Skipped sending Push Notification to Vendor: FCM Token not found in vendor profile');
                }
            }

            if (pushDispatches.length > 0) {
                await Promise.allSettled(pushDispatches);
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

    /**
     * Send emergency SOS alerts to all registered emergency contacts via SMS & Push (Parallelized)
     */
    async notifyEmergency(user, alert) {
        try {
            if (!user) return false;
            const userName = user.name || user.email || 'A user';
            const locationStr = alert?.location?.address ? alert.location.address : (alert?.location?.latitude && alert?.location?.longitude ? `Lat: ${alert.location.latitude}, Long: ${alert.location.longitude}` : 'Unknown Location');
            const message = `EMERGENCY ALERT! ${userName} has triggered an SOS alert on PahadiGo. Location: ${locationStr}. Please check on them immediately.`;
            const contacts = Array.isArray(user.emergencyContacts) ? user.emergencyContacts : [];

            // Dispatch all SMS and push notifications concurrently
            const validContacts = contacts.filter(contact => Boolean(contact?.phone));
            const emergencyDispatches = [
                ...validContacts.map(contact => this.sendSMS(contact.phone, message)),
                ...(user.fcmToken ? [enqueuePushNotification(user.fcmToken, { title: 'SOS Emergency Alert Triggered', body: `Your SOS alert was broadcasted to your emergency contacts.` }, { alertId: String(alert._id || alert.id), type: 'sos_alert' })] : [])
            ];

            if (emergencyDispatches.length > 0) {
                await Promise.allSettled(emergencyDispatches);
            }

            return true;
        } catch (error) {
            return false;
        }
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
            const booking = await getBookingById(bookingId, '', 'vendor user');
            if (!booking) {
                getLogger().error({ bookingId }, `[NotificationService] Invoice generation failed: Booking not found`);
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
                subject: `Invoice for Booking ${booking.bookingCode}`,
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
