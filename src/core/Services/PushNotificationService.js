import { getMessaging } from '@/core/Lib/firebase.js';

const sanitizeDataPayload = (data) => {
    const sanitized = {};
    if (data && typeof data === 'object') {
        Object.entries(data).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
                sanitized[key] = String(val);
            }
        });
    }
    return sanitized;
};

export class PushNotificationService {
    /**
     * Sends a push notification to a single device.
     * @param {string} token - The FCM registration token of the device.
     * @param {object} notification - { title, body, image }
     * @param {object} data - Custom data payload (key-value strings)
     */
    static async sendToDevice(token, notification, data = {}) {
        try {
            const messaging = await getMessaging();
            if (!messaging) {
                console.warn('Firebase Messaging is not initialized. Cannot send notification.');
                return { success: false, error: 'Firebase not initialized' };
            }

            const sanitizedData = sanitizeDataPayload(data);
            sanitizedData.click_action = sanitizedData.click_action || 'FLUTTER_NOTIFICATION_CLICK';

            const payload = {
                token,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.image && { image: notification.image })
                },
                data: sanitizedData,
                // Android specific settings for high priority
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'pahadigo_main_channel'
                    }
                },
                // iOS specific settings
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            console.log('Sending FCM Payload:', JSON.stringify(payload, null, 2));

            const response = await messaging.send(payload);
            console.log(`Successfully sent message to ${token}:`, response);
            return { success: true, messageId: response };
        } catch (error) {
            // Handle common FCM token-related validation/expiration errors gracefully without printing full stack trace
            const isInvalidToken = 
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered' ||
                (error.code === 'messaging/invalid-argument' && 
                 error.message?.includes('registration token'));

            if (isInvalidToken) {
                console.warn(`[PushNotificationService] Token is invalid or unregistered: ${token}`);
            } else {
                console.error('Error sending push notification:', error);
            }
            return { success: false, error: error.message, code: error.code };
        }
    }

    /**
     * Sends a push notification to multiple devices.
     * @param {Array<string>} tokens - Array of FCM registration tokens.
     * @param {object} notification - { title, body, image }
     * @param {object} data - Custom data payload
     */
    static async sendToMultiple(tokens, notification, data = {}) {
        if (!tokens || tokens.length === 0) return { success: false, error: 'No tokens provided' };

        try {
            const messaging = await getMessaging();
            if (!messaging) return { success: false, error: 'Firebase not initialized' };

            const sanitizedData = sanitizeDataPayload(data);
            sanitizedData.click_action = sanitizedData.click_action || 'FLUTTER_NOTIFICATION_CLICK';

            const payload = {
                tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.image && { image: notification.image })
                },
                data: sanitizedData
            };

            // sendEachForMulticast is the modern method for firebase-admin v12+
            const response = await messaging.sendEachForMulticast(payload);
            console.log(`${response.successCount} messages sent successfully, ${response.failureCount} failed.`);
            
            return { success: true, response };
        } catch (error) {
            console.error('Error sending multicast push notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sends a push notification to a specific topic (e.g. 'all_vendors' or 'all_travellers').
     * @param {string} topic - The FCM topic name.
     * @param {object} notification - { title, body, image }
     * @param {object} data - Custom data payload
     */
    static async sendToTopic(topic, notification, data = {}) {
        try {
            const messaging = await getMessaging();
            if (!messaging) return { success: false, error: 'Firebase not initialized' };

            const payload = {
                topic,
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: sanitizeDataPayload(data)
            };

            const response = await messaging.send(payload);
            console.log(`Successfully sent message to topic ${topic}:`, response);
            return { success: true, messageId: response };
        } catch (error) {
            console.error(`Error sending push notification to topic ${topic}:`, error);
            return { success: false, error: error.message };
        }
    }
}
