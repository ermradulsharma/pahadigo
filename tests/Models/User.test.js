import mongoose from 'mongoose';
import User from '@/models/User';
import { cleanDatabase } from '../Helpers/testUtils.js';
import { USER_ROLES, STATUS } from '@/constants';

describe('Industry Standard: User Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(User).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = User.schema || User;
        expect(schema.paths || schema.obj).toBeDefined();
    });

    it('[Database] should save a user successfully with required fields', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            password: 'securepassword123',
            role: USER_ROLES.TRAVELLER,
            status: STATUS.ACTIVE
        };
        const validUser = new User(userData);
        const savedUser = await validUser.save();
        
        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe(userData.name);
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.phone).toBe(userData.phone);
        expect(savedUser.role).toBe(USER_ROLES.TRAVELLER);
    });

    it('[Validation] should fail to save user with duplicate email', async () => {
        const userData = {
            name: 'Test User',
            email: 'duplicate@example.com',
            phone: '1111111111'
        };
        await new User(userData).save();
        
        const duplicateUser = new User({
            name: 'Another User',
            email: 'duplicate@example.com',
            phone: '2222222222'
        });
        
        let error;
        try {
            await duplicateUser.save();
        } catch (err) {
            error = err;
        }
        
        expect(error).toBeDefined();
        expect(error.code).toBe(11000); // MongoDB duplicate key error code
    });

    it('[Security] should hash the password before saving', async () => {
        const userData = {
            name: 'Test Password Hashing',
            email: 'hash@example.com',
            phone: '1234567891',
            password: 'plainpassword123'
        };
        const user = new User(userData);
        const savedUser = await user.save();
        
        expect(savedUser.password).not.toBe('plainpassword123');
        expect(savedUser.password.startsWith('$2a$') || savedUser.password.startsWith('$2b$')).toBeTruthy();
    });

    it('[Security] should correctly compare passwords', async () => {
        const password = 'mysecretpassword';
        const user = new User({
            name: 'Compare Passwords',
            email: 'compare@example.com',
            phone: '9876543210',
            password
        });
        await user.save();
        
        const isMatch = await user.comparePassword(password);
        const isNotMatch = await user.comparePassword('wrongpassword');
        
        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });
});
