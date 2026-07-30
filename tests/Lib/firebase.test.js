import { jest } from '@jest/globals';
import Setting from '@/core/Models/Setting.js';

let FirebaseLib;
let initializeAppMock, certMock, getAppsMock, getMessagingMock;

describe('Firebase Lib', () => {
    beforeAll(async () => {
        initializeAppMock = jest.fn();
        certMock = jest.fn();
        getAppsMock = jest.fn().mockReturnValue([]);
        getMessagingMock = jest.fn().mockReturnValue({});

        jest.unstable_mockModule('firebase-admin/app', () => ({
            initializeApp: initializeAppMock,
            cert: certMock,
            getApps: getAppsMock
        }));

        jest.unstable_mockModule('firebase-admin/messaging', () => ({
            getMessaging: getMessagingMock
        }));

        FirebaseLib = await import('@/core/Lib/firebase.js');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.FIREBASE_PROJECT_ID;
        delete process.env.FIREBASE_CLIENT_EMAIL;
        delete process.env.FIREBASE_PRIVATE_KEY;
        jest.spyOn(Setting, 'findOne').mockResolvedValue(null);
    });

    it('should initialize using env variables if settings are absent', async () => {
        process.env.FIREBASE_PROJECT_ID = 'test-project';
        process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
        process.env.FIREBASE_PRIVATE_KEY = 'test-key';
        
        getAppsMock.mockReturnValueOnce([]);

        await FirebaseLib.initFirebaseAdmin();

        expect(certMock).toHaveBeenCalled();
        expect(initializeAppMock).toHaveBeenCalled();
        expect(getMessagingMock).toHaveBeenCalled();
    });

    it('should return existing app if already initialized', async () => {
        getAppsMock.mockReturnValueOnce([{}]);
        await FirebaseLib.initFirebaseAdmin();
        expect(initializeAppMock).not.toHaveBeenCalled();
        expect(getMessagingMock).toHaveBeenCalled();
    });

    it('should throw an error if config is missing', async () => {
        getAppsMock.mockReturnValueOnce([]);
        await expect(FirebaseLib.initFirebaseAdmin()).rejects.toThrow('FIREBASE settings are missing');
    });

    it('should export firebaseAdmin correctly', () => {
        expect(FirebaseLib.firebaseAdmin.initializeApp).toBeDefined();
        expect(FirebaseLib.firebaseAdmin.cert).toBeDefined();
        expect(FirebaseLib.firebaseAdmin.getApps).toBeDefined();
        expect(FirebaseLib.firebaseAdmin.getMessaging).toBeDefined();
    });
});
