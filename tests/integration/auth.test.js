import { GET as travellerGET } from '@/app/api/traveller/[[...slug]]/route.js';
import { GET as adminGET } from '@/app/api/admin/[[...slug]]/route.js';
import { invokeApi } from '../utils/apiTestHelper.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import mongoose from 'mongoose';
import connectDB from '@/core/Config/db.js';
import jwt from 'jsonwebtoken';

describe('Integration: Auth & Roles', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('[Middleware] should return 401 for protected routes without token', async () => {
        const { status, data } = await invokeApi(travellerGET, 'traveller/me', { method: 'GET' });
        
        expect(status).toBe(HTTP_STATUS.UNAUTHORIZED);
        expect(data.success).toBe(false);
    });

    it('[Roles] should return 403 for unauthorized role', async () => {
        const User = (await import('@/core/Models/User.js')).default;
        const user = await User.create({ 
            name: 'Test', 
            email: 'test@test.com', 
            phone: '1234567890', 
            role: 'traveller', 
            status: 'active' 
        });
        const token = jwt.sign({ id: user._id, role: 'traveller' }, process.env.JWT_SECRET || 'test_secret');
        
        const { status, data } = await invokeApi(adminGET, 'admin/stats', { 
            method: 'GET',
            headers: {
                'authorization': `Bearer ${token}`
            }
        });
        
        expect(status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(data.success).toBe(false);
    });
});
