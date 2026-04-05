import mongoose from 'mongoose';
import Inquiry from '../../../src/core/Models/Inquiry.js';

describe('InquiryModel Test Suite', () => {
    it('should require name, email, and message', async () => {
        const inquiry = new Inquiry({});
        let error;
        try { await inquiry.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.message).toBeDefined();
    });

    it('should create an inquiry with pending and medium defaults', async () => {
        const inquiry = new Inquiry({
            name: 'John',
            email: 'john@example.com',
            message: 'Help me'
        });

        const saved = await inquiry.save();
        expect(saved.status).toBe('pending');
        expect(saved.priority).toBe('medium');
    });
});
