import nodemailer from 'nodemailer';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { renderTemplate } from '@/core/Helpers/TemplateHelper.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import { enqueueInvoice, enqueuePushNotification } from '@/core/Lib/Queue/QueueService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { getBookingById, getUserById, getBusinessById, getBy, getNotificationBy, getNotificationById, getNotificationsBy } from '@/core/Helpers/queryHelpers.js';
import { formatIST } from '@/core/Helpers/dateUtils.js';
import AppError from '@/core/Errors/AppError.js';
import { NOTIFICATION } from '@/core/Constants/notification';
import { STATUS } from '@/core/Constants/index';
import Notification from '@/core/Models/Notification.js';
import CacheService from '@/core/Services/CacheService.js';
import { EventEmitter } from 'events';

// In-memory event emitter for live real-time notification push (SSE)
export const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(0);

/**
 * NotificationService - Centralized service for sending communications
 * via Email (SMTP) and SMS (MSG91/Twilio).
 */
class NotificationService {
    constructor() {
        this._cachedTransporter = null;
        this._lastSmtpKey = null;
    }

    // =========================================================== //
    //                                                             //
    //                          CORE HELPERS                       //
    //                                                             //
    // =========================================================== //

    /**
     * Persist an In-App Notification directly to MongoDB
     */
    async createInAppNotification(payload) {
        try {
            if (!payload || !payload.recipient) return null;
            const notif = await Notification.create(payload);
            try {
                await CacheService.del(`user:notifications:unread:${payload.recipient}`);
            } catch {}

            // Broadcast real-time event to connected SSE clients
            try {
                notificationEmitter.emit('notification', {
                    recipientId: payload.recipient.toString(),
                    notification: notif
                });
            } catch {}

            return notif;
        } catch (error) {
            getLogger().error({ err: error, recipient: payload?.recipient }, '[NotificationService] Error creating in-app notification');
            return null;
        }
    }

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

    async _sendEmailHelper({ to, toName, subject, html, text, attachments }) {
        if (!to) throw AppError.badRequest("Recipient email address ('to') is required");

        const config = await getAppConfig();
        const transporter = await this._getTransporter(config);

        const isGmail = Boolean(config.smtp?.host && config.smtp.host.toLowerCase().includes('gmail'));
        const configuredFrom = config.smtp?.from_address || config.smtp?.from_email;
        // For Gmail SMTP, sending address must match authenticated user to avoid 550 relay/auth rejection.
        // Custom domain is retained in replyTo so user replies reach the official inbox.
        const fromAddress = (isGmail && config.smtp?.user) ? config.smtp.user : (configuredFrom || config.smtp?.user);
        const fromName = config.smtp?.from_name || 'Tripdhara';
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

    async _sendPushNotificationPayload(details) {
        if (details?.fcmToken) {
            await PushNotificationService.sendToDevice(
                details.fcmToken,
                {
                    title: details?.title,
                    body: details?.body,
                    ...(details?.image && { image: details?.image }),
                },
                {
                    type: details?.type,
                    ...(details?.id && { id: details?.id }),
                }
            );
        }
        return true;
    }

    async sendPushNotification(token, notification, data = {}) {
        return await PushNotificationService.sendToDevice(token, notification, data);
    }

    // =========================================================== //
    //                                                             //
    //                        USER NOTIFICATIONS                   //
    //                                                             //
    // =========================================================== //

    async sendSecureCodeEmail(email, data) {
        try {
            const details = { OTP: data }
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.USER.OTP, details);
            await this._sendEmailHelper({ to: email, subject: NOTIFICATION.SUBJECT.AUTH.OTP, html: html });
            return true;
        } catch (error) {
            return false;
        }
    }

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

    async sendAlertEmail(email, details, metadata = {}) {
        try {
            const config = await getAppConfig();
            const baseUrl = config?.app?.url || 'https://tripdhara.com';
            const securityUrl = `${baseUrl}/security`;
            const revokeUrl = metadata.sessionId ? `${baseUrl}/auth/revoke-session?id=${metadata.sessionId}` : `${baseUrl}/security`;

            const account = {
                NAME: details.name,
                ACCOUNT_IDENTIFIER: details.email,
                ROLE: details.role,

                AUTH_METHOD: metadata.authMethod,

                // rawDevice
                OS: metadata.rawDevice.os,
                BROWSER: metadata.rawDevice.browser,
                DEVICE_TYPE: metadata.rawDevice.deviceType,
                DEVICE_NAME: metadata.rawDevice.deviceName,
                SUMMARY: metadata.rawDevice.summary,

                // appInfo
                APP_VERSION: metadata.appInfo.appVersion,
                PLATFORM: metadata.appInfo.platform,
                DEVICE_ID: metadata.appInfo.deviceId,
                CARRIER: metadata.appInfo.carrier,

                // ip
                IP_ADDRESS: metadata.ipAddress,
                REAL_IP: metadata.realIp,
                IP: metadata.ip,

                // Device
                DEVICE: metadata.device,

                // location
                LOCATION: metadata.location,

                // cdn
                DATACENTER: metadata.cdn.datacenter,
                TIME: details.loginTime,
                NEW_DEVICE_BADGE: Boolean(metadata.isNewDevice),
                SECURITY_URL: securityUrl,
                REVOKE_URL: revokeUrl
            }
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.USER.ALERT, account);
            await this._sendEmailHelper({ to: email, subject: NOTIFICATION.SUBJECT.AUTH.ALERT, html: html });
            return true;
        } catch (error) {
            return false;
        }
    }

    async sendLoginAlertSMS(phone, details) {
        const message = `PahadiGo Alert: Your account was logged in from ${details.device} (${details.location}) at ${details.loginTime}. If this wasn't you, please secure your account.`;
        return await this.sendSMS(phone, message);
    }

    async sendWelcomeEmail(email, details) {
        try {
            const config = await getAppConfig();
            const exploreUrl = config?.app?.url ? `${config.app.url}/explore` : 'https://tripdhara.com/explore';
            const account = {
                NAME: details?.name || '',
                ACCOUNT_IDENTIFIER: email || details?.email || '',
                JOIN_DATE: details?.createdAt || '',
                EXPLORE_URL: exploreUrl
            }
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.USER.WELCOME, account);
            await this._sendEmailHelper({ to: email, subject: NOTIFICATION.SUBJECT.AUTH.WELCOME, html: html });
            return true;
        } catch (error) {
            getLogger().error({ err: error }, "[NotificationService] sendWelcomeEmail Error");
            return false;
        }
    }

    // ================================================================== //
    //                                                                    //
    //                   USER EVENTS EMAILS                               //
    //                                                                    //
    // ================================================================== //

    async sendProfileUpdateEmail(email, details) {
        try {
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(details?.name)}&background=ffffff&color=2e7d32&size=128&bold=true`;
            const account = {
                USER_NAME: details?.name || '',
                ACCOUNT_IDENTIFIER: details?.email ? details?.email : details?.phone || '',
                PHONE: details?.phone || '',
                EMAIL: details?.email || '',
                UPDATE_TIME: details?.updatedAt || '',
                PROFILE_IMAGE: details?.profileImage || defaultAvatar,
                SECURITY_URL: 'https://tripdhara.com/security'
            }
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.USER.PROFILE.UPDATED, account);
            await this._sendEmailHelper({ to: email, subject: NOTIFICATION.SUBJECT.USER.PROFILE_UPDATE, html: html });
            return true;
        } catch (error) {
            getLogger().error({ err: error }, "[NotificationService] sendProfileUpdateEmail Error");
            return false;
        }
    }


    // ================================================================== //
    //                                                                    //
    //                   BUSINESS Events Emails                           //
    //                                                                    //
    // ================================================================== //
    async sendBusinessWelcomeEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';

            const accountDetails = {
                // USER INFO
                USER_NAME: details?.name || '',
                FCM_TOKEN: details?.fcmToken,
                ID: String(details?.id || ''),

                // IMAGE INFO
                IMAGE_URL: String(businessProfile?.profileImage || details?.profileImage || null),

                // BUSINESS INFO
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || ''
            };

            const html = await renderTemplate(NOTIFICATION.TEMPLATE.BUSINESS.WELCOME, accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.WELCOME,
                    html: html
                })
            ];

            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.WELCOME,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.WELCOME,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.WELCOME
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }

            const results = await Promise.allSettled(tasks);

            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendVendorWelcomeEmail subtask failed');
            });

            return true;
        } catch (error) {
            getLogger().error({ err: error, email }, '[NotificationService] sendVendorWelcomeEmail Error');
            return false;
        }
    }

    async sendBusinessProfileUpdateEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';
            const accountDetails = {
                USER_NAME: details?.name,
                FCM_TOKEN: details?.fcmToken,
                IMAGE_URL: businessProfile?.profileImage || details?.profileImage || null,
                ID: businessProfile?.id || details?.id || '',
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || ''
            };
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.BUSINESS.PROFILE_UPDATE, accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.PROFILE_UPDATE,
                    html: html
                })
            ];
            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.PROFILE_UPDATE,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.PROFILE_UPDATE,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.PROFILE_UPDATE
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }
            const results = await Promise.allSettled(tasks);
            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendUpdateBusinessProfileEmail subtask failed');
            });
            return true;
        } catch (error) {
            getLogger().error({ err: error, email }, '[NotificationService] sendUpdateBusinessProfileEmail Error');
            return false;
        }
    }

    async sendBusinessOperationalStatusEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';
            const accountDetails = {
                USER_NAME: details?.name,
                FCM_TOKEN: details?.fcmToken,
                IMAGE_URL: businessProfile?.profileImage || details?.profileImage || null,
                ID: businessProfile?.id || details?.id || '',
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || '',
                DEACTIVATION_DATE: businessProfile?.deletedAt,
                STATUS: businessProfile?.status
            };
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.BUSINESS.OPERATING_STATUS_UPDATED, accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.OPERATING_STATUS_UPDATED,
                    html: html
                })
            ];
            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.OPERATING_STATUS_UPDATED,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.OPERATING_STATUS_UPDATED,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.OPERATING_STATUS_UPDATED
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }
            const results = await Promise.allSettled(tasks);
            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendUpdateBusinessProfileEmail subtask failed');
            });
            return true;
        } catch (error) {
            getLogger().error({ err: error, email }, '[NotificationService] sendUpdateBusinessProfileEmail Error');
            return false;
        }
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

    async sendBusinessProfileDeletedEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';
            const accountDetails = {
                USER_NAME: details?.name,
                FCM_TOKEN: details?.fcmToken,
                IMAGE_URL: businessProfile?.profileImage || details?.profileImage || null,
                ID: businessProfile?.id || details?.id || '',
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || ''
            };
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.BUSINESS.PROFILE_UPDATE, accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.PROFILE_UPDATE,
                    html: html
                })
            ];
            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.PROFILE_UPDATE,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.PROFILE_UPDATE,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.PROFILE_UPDATE
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }
            const results = await Promise.allSettled(tasks);
            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendUpdateBusinessProfileEmail subtask failed');
            });
            return true;
        } catch (error) {
            getLogger().error({ err: error, email }, '[NotificationService] sendUpdateBusinessProfileEmail Error');
            return false;
        }
    }

    async sendBusinessProfileDeactivatedEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';
            const accountDetails = {
                USER_NAME: details?.name,
                FCM_TOKEN: details?.fcmToken,
                IMAGE_URL: businessProfile?.profileImage || details?.profileImage || null,
                ID: businessProfile?.id || details?.id || '',
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || '',
                DEACTIVATION_DATE: businessProfile?.updatedAt,
                STATUS: businessProfile?.status
            };
            const html = await renderTemplate(NOTIFICATION.TEMPLATE.BUSINESS.PROFILE_DEACTIVATED, accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.PROFILE_DEACTIVATED,
                    html: html
                })
            ];
            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.PROFILE_DEACTIVATED,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.PROFILE_DEACTIVATED,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.PROFILE_DEACTIVATED
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }
            const results = await Promise.allSettled(tasks);
            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendUpdateBusinessProfileEmail subtask failed');
            });
            return true;
        } catch (error) {
            getLogger().error({ err: error, email }, '[NotificationService] sendUpdateBusinessProfileEmail Error');
            return false;
        }
    }

    // Business's Bank Details Created/Updated
    async sendBusinessBankDetailsCreatedEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';

            const accountDetails = {
                // USER INFO
                USER_NAME: details?.name || '',
                FCM_TOKEN: details?.fcmToken,
                ID: String(details?.id || ''),

                // IMAGE INFO
                IMAGE_URL: String(businessProfile?.profileImage || details?.profileImage || null),

                // BUSINESS INFO
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || ''
            };

            const html = await renderTemplate('Emails/vendor/bank.html', accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.BANK_DETAILS_UPDATED,
                    html: html
                })
            ];

            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.BANK_DETAILS_UPDATED,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.BANK_DETAILS_UPDATED,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.BANK_DETAILS_UPDATED
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }
            const results = await Promise.allSettled(tasks);

            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendBusinessBankDetailsUpdatedEmail subtask failed');
            });
            return true;
        } catch (error) {
            getLogger().error({ err: error }, "[NotificationService] sendBusinessBankDetailsUpdatedEmail Error");
            return false;
        }
    }

    async sendBusinessBankDetailsUpdatedEmail(email, details) {
        try {
            const businessProfile = details?.businessProfile || {};
            const businessName = businessProfile?.businessName || 'Partner';

            const accountDetails = {
                // USER INFO
                USER_NAME: details?.name || '',
                FCM_TOKEN: details?.fcmToken,
                ID: String(details?.id || ''),

                // IMAGE INFO
                IMAGE_URL: String(businessProfile?.profileImage || details?.profileImage || null),

                // BUSINESS INFO
                BUSINESS_NAME: businessName,
                BUSINESS_OWNER_NAME: businessProfile?.ownerName || '',
                BUSINESS_ADDRESS: businessProfile?.address || '',
                BUSINESS_PHONE: businessProfile?.businessNumber || ''
            };

            const html = await renderTemplate('Emails/vendor/bank.html', accountDetails);
            const tasks = [
                this._sendEmailHelper({
                    to: email,
                    toName: accountDetails.BUSINESS_NAME,
                    subject: NOTIFICATION.SUBJECT.BUSINESS.BANK_DETAILS_UPDATED,
                    html: html
                })
            ];

            if (accountDetails.FCM_TOKEN) {
                const payload = {
                    fcmToken: accountDetails.FCM_TOKEN,
                    id: accountDetails.ID,
                    image: accountDetails.IMAGE_URL,
                    title: NOTIFICATION.PUSH.BUSINESS.TITLE.BANK_DETAILS_UPDATED,
                    body: NOTIFICATION.PUSH.BUSINESS.BODY.BANK_DETAILS_UPDATED,
                    type: NOTIFICATION.PUSH.BUSINESS.TYPE.BANK_DETAILS_UPDATED
                };
                tasks.push(this._sendPushNotificationPayload(payload));
            }
            const results = await Promise.allSettled(tasks);

            results.forEach((res, index) => {
                if (res.status === 'rejected') getLogger().error({ err: res.reason, task: index === 0 ? 'Email' : 'PushNotification', email }, '[NotificationService] sendBusinessBankDetailsUpdatedEmail subtask failed');
            });
            return true;
        } catch (error) {
            getLogger().error({ err: error }, "[NotificationService] sendBusinessBankDetailsUpdatedEmail Error");
            return false;
        }
    }

    // Business Document Uploaded
    async sendBusinessDocumentsEmail(email, businessName) {
        try {
            const html = await renderTemplate('Emails/vendor/documents.html', { BUSINESS_NAME: businessName });
            await this._sendEmailHelper({ to: email, toName: businessName, subject: `Documents Received - PahadiGo`, html: html });
            return true;
        } catch (error) {
            getLogger().error({ err: error }, "[NotificationService] sendVendorDocumentsReceivedEmail Error");
            return false;
        }
    }

    // Business Document Updated 
    async sendBusinessDocumentsUpdatedEmail(email, businessName) {
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

            // Dispatch in-app and push notifications to Traveller and Vendor in parallel
            const pushDispatches = [];

            if (travellerTitle && travellerBody && travellerId) {
                // Save in-app notification to DB
                this.createInAppNotification({
                    recipient: travellerId,
                    recipientRole: 'traveller',
                    title: travellerTitle,
                    message: travellerBody,
                    type: `BOOKING_${status.toUpperCase()}`,
                    category: 'booking',
                    priority: status === 'cancelled' ? 'high' : 'medium',
                    actionUrl: `/traveller/bookings/${booking._id}`,
                    data: dataPayload,
                    groupKey: `booking_${booking._id}`,
                    deliveryStatus: {
                        inApp: true,
                        push: {
                            sent: Boolean(travellerUser && travellerUser.fcmToken),
                            sentAt: (travellerUser && travellerUser.fcmToken) ? new Date() : null
                        }
                    }
                });

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
                // Save in-app notification to DB
                this.createInAppNotification({
                    recipient: vendorUserId,
                    recipientRole: 'vendor',
                    title: vendorTitle,
                    message: vendorBody,
                    type: `BOOKING_${status.toUpperCase()}`,
                    category: 'booking',
                    priority: status === 'cancelled' ? 'high' : 'medium',
                    actionUrl: `/vendor/bookings/${booking._id}`,
                    data: dataPayload,
                    groupKey: `booking_${booking._id}`,
                    deliveryStatus: {
                        inApp: true,
                        push: {
                            sent: Boolean(vendorUser && vendorUser.fcmToken),
                            sentAt: (vendorUser && vendorUser.fcmToken) ? new Date() : null
                        }
                    }
                });

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

    // ================================================================== //
    //                                                                    //
    //                   IN-APP NOTIFICATIONS DOMAIN HUB                  //
    //                                                                    //
    // ================================================================== //

    /**
     * Fetch user notifications with pagination and unread counts
     */
    async getUserNotifications(userId, { page = 1, limit = 15, filter = 'all' } = {}) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));

        const query = {
            recipient: userId,
            isDeleted: false
        };

        if (filter === 'unread') {
            query.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            getNotificationsBy(query, '', null, { createdAt: -1 }, {
                skip: (pageNum - 1) * limitNum,
                limit: limitNum,
                lean: true
            }),
            Notification.countDocuments(query),
            Notification.getUnreadCount(userId)
        ]);

        return {
            notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
                unreadCount
            }
        };
    }

    /**
     * Get unread notifications count for a user (Redis cached)
     */
    async getUnreadCount(userId) {
        if (!userId) return 0;
        const cacheKey = `user:notifications:unread:${userId}`;
        try {
            const cached = await CacheService.get(cacheKey);
            if (cached !== null && cached !== undefined) return Number(cached);
        } catch {}

        const count = await Notification.getUnreadCount(userId);
        try {
            await CacheService.set(cacheKey, count, 120);
        } catch {}
        return count;
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await getNotificationBy({ _id: notificationId, recipient: userId, isDeleted: false }, '', null, { lean: false });
        if (!notification) return null;

        await notification.markAsRead();
        try {
            await CacheService.del(`user:notifications:unread:${userId}`);
        } catch {}
        const unreadCount = await this.getUnreadCount(userId);
        return { notification, unreadCount };
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        await Notification.markAllAsRead(userId);
        try {
            await CacheService.del(`user:notifications:unread:${userId}`);
        } catch {}
        return true;
    }

    /**
     * Soft dismiss a single notification
     */
    async dismissNotification(notificationId, userId) {
        const notification = await getNotificationBy({ _id: notificationId, recipient: userId }, '', null, { lean: false });
        if (!notification) return null;

        await notification.dismiss();
        try {
            await CacheService.del(`user:notifications:unread:${userId}`);
        } catch {}
        const unreadCount = await this.getUnreadCount(userId);
        return { unreadCount };
    }

    /**
     * Soft dismiss all notifications for a user
     */
    async clearAllNotifications(userId) {
        await Notification.clearAll(userId);
        try {
            await CacheService.del(`user:notifications:unread:${userId}`);
        } catch {}
        return true;
    }

    /**
     * Centrally dispatch profile update notification
     */
    async notifyProfileUpdated(user) {
        const userId = user?._id || user?.id;
        if (!userId) return null;

        return await this.createInAppNotification({
            recipient: userId,
            recipientRole: user.role || 'traveller',
            title: 'Profile Updated',
            message: 'Your profile details have been updated successfully.',
            type: 'PROFILE_UPDATED',
            category: 'account',
            priority: 'low',
            actionUrl: user.role === 'admin' ? '/admin/profile' : (user.role === 'vendor' ? '/vendor/profile' : '/profile'),
            data: { updatedAt: new Date() },
            groupKey: `profile_update_${userId}`,
            deliveryStatus: { inApp: true }
        });
    }
}

export default new NotificationService();
