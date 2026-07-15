import { POST, GET } from '@/app/api/[...slug]/route.js';
import { invokeApi } from '../utils/apiTestHelper.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import mongoose from 'mongoose';
import connectDB from '@/core/Config/db.js';

describe('Integration: API Dispatcher', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('[Routing] should return 404 for unknown endpoints', async () => {
        const { status, data } = await invokeApi(GET, 'this/path/does/not/exist', { method: 'GET' });
        
        expect(status).toBe(HTTP_STATUS.NOT_FOUND);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('message', 'The requested resource was not found.');
    });

    it('[Parsing] should correctly parse JSON body', async () => {
        const { status, data } = await invokeApi(POST, 'auth/login', { 
            method: 'POST',
            body: { 
                email: 'not-an-email' 
            }
        });
        
        expect(status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data).toHaveProperty('success', false);
        expect(data.message).toBeDefined();
    });
});
