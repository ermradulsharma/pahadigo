process.env.JWT_SECRET = 'test_secret';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AuthService = require('../services/AuthService');
const User = require('../models/User');

// Mock global fetch for Facebook
global.fetch = async (url) => {
    if (url.includes('graph.facebook.com')) {
        return {
            json: async () => ({
                id: '1234567890',
                name: 'Facebook User',
                email: 'fbuser@example.com'
            })
        };
    }
    return { json: async () => ({}) };
};

(async () => {
    let mongoServer;
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log("Connected to Mongo");

        // --- Test Facebook Auth ---
        console.log("Testing Facebook Auth...");
        const fbResult = await AuthService.facebookAuth('mock_access_token');
        if (fbResult.user.email === 'fbuser@example.com' && fbResult.user.facebookId === '1234567890' && fbResult.isNewUser === true) {
            console.log("✅ Facebook Auth Passed (New User)");
        } else {
            console.error("❌ Facebook Auth Failed", fbResult);
            process.exit(1);
        }

        // Test existing FB User
        console.log("Testing Facebook Auth (Existing)...");
        const fbResult2 = await AuthService.facebookAuth('mock_access_token');
        if (fbResult2.isNewUser === false) {
            console.log("✅ Facebook Auth Passed (Existing User)");
        } else {
            console.error("❌ Facebook Auth Failed (Existing)", fbResult2);
            process.exit(1);
        }


        // --- Test Apple Auth ---
        console.log("Testing Apple Auth...");
        // Create a dummy JWT for Apple ID Token (header.payload.signature)
        // We can use a real jwt.sign if available, otherwise manual construction
        const jwt = require('jsonwebtoken'); // Assuming available in node_modules
        const appleToken = jwt.sign({
            sub: 'apple_123',
            email: 'apple@example.com'
        }, 'secret'); // key doesn't matter as we only decode

        const appleResult = await AuthService.appleAuth(appleToken, 'user', { firstName: 'Apple', lastName: 'User' });

        if (appleResult.user.email === 'apple@example.com' && appleResult.user.appleId === 'apple_123' && appleResult.isNewUser === true) {
            console.log("✅ Apple Auth Passed (New User)");
        } else {
            console.error("❌ Apple Auth Failed", appleResult);
            process.exit(1);
        }

        // Test existing Apple User
        console.log("Testing Apple Auth (Existing)...");
        const appleResult2 = await AuthService.appleAuth(appleToken);
        if (appleResult2.isNewUser === false) {
            console.log("✅ Apple Auth Passed (Existing User)");
        } else {
            console.error("❌ Apple Auth Failed (Existing)", appleResult2);
            process.exit(1);
        }

        console.log("🎉 All Tests Passed!");

    } catch (e) {
        console.error("Test Failed with Error:", e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        if (mongoServer) await mongoServer.stop();
    }
})();
