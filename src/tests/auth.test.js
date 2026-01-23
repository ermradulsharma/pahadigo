// Mock dependencies BEFORE requiring the service
jest.mock('google-auth-library');
jest.mock('jsonwebtoken', () => ({
    decode: jest.fn(),
    sign: jest.fn(() => 'mock_token'), // AuthService uses generateToken which uses sign
    verify: jest.fn(),
}));

jest.mock('../helpers/jwt', () => ({
    generateToken: jest.fn(() => 'mock_token'),
    verifyToken: jest.fn(),
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Now require AuthService, which will use the mocked dependencies
const AuthService = require('../services/AuthService');

// Mock global fetch for Facebook
global.fetch = jest.fn();

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('AuthService Social Login', () => {

    describe('Facebook Auth', () => {
        it('should create a new user with facebook provider', async () => {
            const mockFbResponse = {
                id: '1234567890',
                name: 'Facebook User',
                email: 'fbuser@example.com'
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockFbResponse
            });

            const result = await AuthService.facebookAuth('mock_access_token');

            expect(result.token).toBe('mock_token');
            expect(result.isNewUser).toBe(true);
            expect(result.user.email).toBe('fbuser@example.com');
            expect(result.user.facebookId).toBe('1234567890');
            expect(result.user.authProvider).toBe('facebook');

            const dbUser = await User.findOne({ email: 'fbuser@example.com' });
            expect(dbUser).toBeTruthy();
        });

        it('should login existing user and update facebookId if missing', async () => {
            await User.create({
                email: 'existing@example.com',
                name: 'Existing User',
                authProvider: 'local'
            });

            const mockFbResponse = {
                id: '987654321',
                name: 'Existing User',
                email: 'existing@example.com'
            };

            global.fetch.mockResolvedValueOnce({
                json: async () => mockFbResponse
            });

            const result = await AuthService.facebookAuth('mock_access_token');

            expect(result.isNewUser).toBe(false);
            expect(result.user.facebookId).toBe('987654321');

            const dbUser = await User.findOne({ email: 'existing@example.com' });
            expect(dbUser.facebookId).toBe('987654321');
        });
    });

    describe('Apple Auth', () => {
        it('should create a new user with apple provider', async () => {
            const mockAppleToken = {
                sub: 'apple_unique_id',
                email: 'appleuser@example.com'
            };

            jwt.decode.mockReturnValue(mockAppleToken);

            const result = await AuthService.appleAuth('mock_id_token', 'user', { firstName: 'Apple', lastName: 'User' });

            expect(result.token).toBe('mock_token');
            expect(result.isNewUser).toBe(true);
            expect(result.user.email).toBe('appleuser@example.com');
            expect(result.user.appleId).toBe('apple_unique_id');
            expect(result.user.authProvider).toBe('apple');
            expect(result.user.name).toBe('Apple User');
        });

        it('should login existing user with Apple ID', async () => {
            await User.create({
                email: 'existing_apple@example.com',
                name: 'Apple User',
                appleId: 'existing_apple_id',
                authProvider: 'apple'
            });

            const mockAppleToken = {
                sub: 'existing_apple_id',
                email: 'existing_apple@example.com'
            };

            jwt.decode.mockReturnValue(mockAppleToken);

            const result = await AuthService.appleAuth('mock_id_token');

            expect(result.isNewUser).toBe(false);
            expect(result.user.email).toBe('existing_apple@example.com');
            expect(result.user.appleId).toBe('existing_apple_id');
        });
    });
});
