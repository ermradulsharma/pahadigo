import admin from 'firebase-admin';
import Setting from '@/core/Models/Setting.js';

let isInitialized = false;

export const initFirebaseAdmin = async () => {
    if (admin.apps.length) {
        isInitialized = true;
        return admin.messaging();
    }

    try {
        // Fallback to ENV if DB fails or settings are empty
        const settings = await Setting.findOne() || {};
        
        const projectId = settings.firebase_project_id || process.env.FIREBASE_PROJECT_ID;
        const clientEmail = settings.firebase_client_email || process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = settings.firebase_private_key || process.env.FIREBASE_PRIVATE_KEY;

        if (projectId && clientEmail && privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                })
            });
            isInitialized = true;
            return admin.messaging();
        } else {
            throw new Error('FIREBASE settings are missing in Database/ENV. Push notifications will not work.');
        }
    } catch (error) {
        throw new Error(`Firebase Admin Initialization Error: ${error.message}`);
    }
};

export const getMessaging = async () => {
    if (isInitialized && admin.apps.length) {
        return admin.messaging();
    }
    return await initFirebaseAdmin();
};

export const firebaseAdmin = admin;
