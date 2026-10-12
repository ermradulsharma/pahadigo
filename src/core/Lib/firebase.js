import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging as getFcmMessaging } from 'firebase-admin/messaging';
import Setting from '@/core/Models/Setting.js';

let isInitialized = false;
let initFailed = false;
let lastFailureTime = 0;
const RETRY_INTERVAL_MS = 60000; // Retry checking settings every 60s if previously missing

export const initFirebaseAdmin = async () => {
    const apps = getApps();
    if (apps.length) {
        isInitialized = true;
        initFailed = false;
        return getFcmMessaging(apps[0]);
    }

    // If previously failed within the last 60 seconds, skip hitting DB repeatedly
    if (initFailed && (Date.now() - lastFailureTime < RETRY_INTERVAL_MS)) {
        return null;
    }

    try {
        // Check ENV first (0ms latency)
        let projectId = process.env.FIREBASE_PROJECT_ID;
        let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Fallback to DB settings if ENV is incomplete
        if (!projectId || !clientEmail || !privateKey) {
            const settings = await Setting.findOne().lean() || {};
            projectId = projectId || settings.firebase_project_id;
            clientEmail = clientEmail || settings.firebase_client_email;
            privateKey = privateKey || settings.firebase_private_key;
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
            initFailed = false;
            return getFcmMessaging(app);
        } else {
            initFailed = true;
            lastFailureTime = Date.now();
            return null;
        }
    } catch (error) {
        initFailed = true;
        lastFailureTime = Date.now();
        return null;
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

