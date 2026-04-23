import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Policy.js', () => ({
    default: { find: jest.fn(), findOne: jest.fn(), findOneAndUpdate: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/Inquiry.js', () => ({
    default: { create: jest.fn(), find: jest.fn(() => ({ sort: jest.fn().mockResolvedValue([]) })), findByIdAndUpdate: jest.fn() }
}));

jest.unstable_mockModule('@/core/Helpers/security.js', () => ({
    sanitizeHTML: jest.fn(c => c)
}));

const { default: PolicyService } = await import('@/services/Admin/PolicyService.js');
const { default: Policy } = await import('@/core/Models/Policy.js');
const { default: Inquiry } = await import('@/core/Models/Inquiry.js');

describe('Industry Standard: Admin PolicyService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[updatePolicy]', () => {
        it('[Success] should update and sanitize policy content', async () => {
            const content = '<h1>New</h1>';
            Policy.findOneAndUpdate.mockResolvedValue({ content });

            const result = await PolicyService.updatePolicy('traveller', 'terms', content, 'a1');

            expect(Policy.findOneAndUpdate).toHaveBeenCalled();
            expect(result.content).toBe(content);
        });
    });

    describe('[submitInquiry]', () => {
        it('[Success] should create a new inquiry', async () => {
            const data = { subject: 'Help', message: 'SOS' };
            await PolicyService.submitInquiry(data);
            expect(Inquiry.create).toHaveBeenCalledWith(data);
        });
    });
});
