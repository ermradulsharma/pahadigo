import mongoose from 'mongoose';
import User from '../../../src/core/Models/User.js';
import { USER_ROLES, AUTH_PROVIDERS, STATUS } from '../../../src/core/Constants/index.js';

describe('UserModel Test Suite', () => {

    it('should create a user with default fields successfully', async () => {
        const userData = { email: 'test@example.com', password: 'Password123!', role: USER_ROLES.TRAVELLER };
        const validUser = new User(userData);
        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.authProvider).toBe(AUTH_PROVIDERS.PHONE);
        expect(savedUser.status).toBe(STATUS.PENDING);
        expect(savedUser.isVerified).toBe(false);
    });

    it('should hash the password on save hook', async () => {
        const plainPassword = 'SuperSecretPassword123';
        const user = new User({ email: 'hash@example.com', password: plainPassword });
        const savedUser = await user.save();

        // Ensure the password explicitly saved is not the plaintext one
        const reFetchedUser = await User.findById(savedUser._id).select('+password');
        expect(reFetchedUser.password).not.toBe(plainPassword);

        // Ensure comparePassword method works
        const isMatch = await reFetchedUser.comparePassword(plainPassword);
        expect(isMatch).toBe(true);
    });

    it('should throw an error for duplicate emails', async () => {
        const user1 = new User({ email: 'duplicate@example.com', password: 'test1' });
        await user1.save();

        const user2 = new User({ email: 'duplicate@example.com', password: 'test2' });
        let error;
        try {
            await user2.save();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.code).toBe(11000); // MongoDB duplicate key error code
    });

    it('should enforce enum restrictions on roles', async () => {
        const user = new User({ email: 'role@example.com', role: 'INVALID_ROLE', password: 'pwd' });
        let error;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.role).toBeDefined();
    });
});
