import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging as getFcmMessaging } from 'firebase-admin/messaging';
import Setting from '@/core/Models/Setting.js';

let isInitialized = false;

export const initFirebaseAdmin = async () => {
    const apps = getApps();
    if (apps.length) {
        isInitialized = true;
        return getFcmMessaging(apps[0]);
    }

    try {
        // Check ENV first (0ms latency)
        let projectId = process.env.FIREBASE_PROJECT_ID;
        let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Fallback to DB settings if ENV is incomplete
        if (!projectId || !clientEmail || !privateKey) {
            const settings = await Setting.findOne();
            if (settings) {
                const sObj = settings.toObject ? settings.toObject() : settings;
                projectId = projectId || sObj.firebase_project_id;
                clientEmail = clientEmail || sObj.firebase_client_email;
                privateKey = privateKey || sObj.firebase_private_key;
            }
        }

        if (projectId && clientEmail && privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            const app = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                })
            });
            isInitialized = true;
            return getFcmMessaging(app);
        } else {
            throw new Error('FIREBASE settings are missing in Database/ENV. Push notifications will not work.');
        }
    } catch (error) {
        throw new Error(`Firebase Admin Initialization Error: ${error.message}`);
    }
};

export const getMessaging = async () => {
    const apps = getApps();
    if (isInitialized && apps.length) {
        return getFcmMessaging(apps[0]);
    }
    return await initFirebaseAdmin();
};

export const firebaseAdmin = { initializeApp, cert, getApps, getMessaging: getFcmMessaging };

