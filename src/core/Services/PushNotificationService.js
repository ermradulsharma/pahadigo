import { getMessaging } from '@/core/Lib/firebase.js';

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

            const payload = {
                token,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.image && { image: notification.image })
                },
                data: {
                    ...data,
                    click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
                },
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

            const response = await messaging.send(payload);
            console.log(`Successfully sent message to ${token}:`, response);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('Error sending push notification:', error);
            // Handle common FCM errors (e.g., token expired)
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                console.warn(`Token ${token} is no longer valid or unregistered.`);
                // TODO: Optionally trigger an event to remove this token from the user database
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

            const payload = {
                tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.image && { image: notification.image })
                },
                data: {
                    ...data,
                    click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
                }
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
                data
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
