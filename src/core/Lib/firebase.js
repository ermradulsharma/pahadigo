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
        // Fallback to ENV if DB fails or settings are empty
        const settings = await Setting.findOne() || {};
        
        const projectId = settings.firebase_project_id || process.env.FIREBASE_PROJECT_ID;
        const clientEmail = settings.firebase_client_email || process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = settings.firebase_private_key || process.env.FIREBASE_PRIVATE_KEY;

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
