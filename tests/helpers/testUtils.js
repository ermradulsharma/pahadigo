import { jest } from '@jest/globals';
import { USER_ROLES } from '../../src/core/Constants/index.js';
import mongoose from 'mongoose';

/**
 * Creates a mocked Request object for controller tests.
 */
export const createMockReq = (data = {}) => {
    const userDefaults = { id: new mongoose.Types.ObjectId().toString(), role: USER_ROLES.TRAVELLER };
    const { 
        user = {}, // Passed user object
        jsonBody = {}, 
        url = 'http://localhost',
        params = {},
        validData = null
    } = data;
    
    // If data.user was explicitly set to null, the above 'user = {}' won't trigger if it was present but null in data?
    // Actually, in ES6 destructuring, if data.user is null, user becomes null.
    const finalUser = (data.user === null) ? null : { ...userDefaults, ...user };

    return {
        user: finalUser,
        jsonBody,
        url,
        params,
        validData: validData || jsonBody,
        headers: {
            get: (name) => {
                if (name.toLowerCase() === 'authorization') return 'Bearer mock-token';
                return null;
            }
        },
        json: async function() { return this.jsonBody; }
    };
};

/**
 * Common mock for response objects (if needed, though we test controller return values).
 */
export const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

/**
 * Database utility for integration tests.
 */
export const cleanDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
};

/**
 * Helper to generate a valid Mongoose ID.
 */
export const generateId = () => new mongoose.Types.ObjectId();
