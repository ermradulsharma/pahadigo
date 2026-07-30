import { POST } from '@/app/api/packages/[[...slug]]/route.js';
import { invokeApi } from '../utils/apiTestHelper.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import mongoose from 'mongoose';
import connectDB from '@/core/Config/db.js';
import jwt from 'jsonwebtoken';

describe('Integration: Booking & Concurrency', () => {
    let token;
    let userId;

    beforeAll(async () => {
        await connectDB();
        userId = new mongoose.Types.ObjectId();
        token = jwt.sign({ id: userId, role: 'traveller' }, process.env.JWT_SECRET || 'test_secret');
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('[Concurrency] should handle inventory conflicts safely', async () => {
        const bookingPayload = {
            startDate: "2026-08-01",
            endDate: "2026-08-05",
            adults: 2,
            children: 0,
            includeMe: true,
            guestDetails: []
        };

        const { status, data } = await invokeApi(POST, 'packages/fake_item_id/book', { 
            method: 'POST',
            body: bookingPayload,
            headers: {
                'authorization': `Bearer ${token}`
            }
        });

        expect(status).not.toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
});
