import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Policy.js', () => ({
    default: {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Inquiry.js', () => ({
    default: {
        create: jest.fn(),
        find: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/security.js', () => ({
    sanitizeHTML: jest.fn((content) => `sanitized: ${content}`)
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

const { default: PolicyService } = await import('@/core/Services/Admin/PolicyService.js');
const { default: Policy } = await import('@/core/Models/Policy.js');
const { default: Inquiry } = await import('@/core/Models/Inquiry.js');
const { sanitizeHTML } = await import('@/core/Helpers/security.js');

describe('Admin PolicyService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPolicies', () => {
        it('should get all policies if no target provided', async () => {
            Policy.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ type: 'terms' }]) });
            const result = await PolicyService.getPolicies();
            expect(Policy.find).toHaveBeenCalledWith({});
            expect(result).toHaveLength(1);
        });

        it('should get policies by target', async () => {
            Policy.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ type: 'terms' }]) });
            await PolicyService.getPolicies('traveller');
            expect(Policy.find).toHaveBeenCalledWith({ target: 'traveller' });
        });
    });

    describe('getPolicy', () => {
        it('should get a specific policy', async () => {
            Policy.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ content: 'test' }) });
            await PolicyService.getPolicy('vendor', 'terms');
            expect(Policy.findOne).toHaveBeenCalledWith({ target: 'vendor', type: 'terms' });
        });
    });

    describe('updatePolicy', () => {
        it('should sanitize content and update policy', async () => {
            Policy.findOneAndUpdate.mockResolvedValue({ target: 'vendor', content: 'sanitized: raw_html' });
            
            const result = await PolicyService.updatePolicy('vendor', 'terms', 'raw_html', 'admin1');
            
            expect(sanitizeHTML).toHaveBeenCalledWith('raw_html');
            expect(Policy.findOneAndUpdate).toHaveBeenCalledWith(
                { target: 'vendor', type: 'terms' },
                { content: 'sanitized: raw_html', lastUpdatedBy: 'admin1' },
                { new: true, upsert: true }
            );
            expect(result.content).toBe('sanitized: raw_html');
        });
    });

    describe('seedPolicies', () => {
        it('should seed default policies', async () => {
            Policy.findOneAndUpdate.mockResolvedValue({});
            
            const result = await PolicyService.seedPolicies();
            
            expect(Policy.findOneAndUpdate).toHaveBeenCalledTimes(3);
            expect(result).toBe(true);
        });
    });

    describe('submitInquiry', () => {
        it('should create a new inquiry', async () => {
            const data = { subject: 'Help' };
            Inquiry.create.mockResolvedValue({ _id: 'i1', ...data });
            const result = await PolicyService.submitInquiry(data);
            expect(Inquiry.create).toHaveBeenCalledWith(data);
            expect(result._id).toBe('i1');
        });
    });

    describe('getInquiries', () => {
        it('should fetch inquiries sorted by createdAt desc', async () => {
            Inquiry.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
            await PolicyService.getInquiries();
            expect(Inquiry.find).toHaveBeenCalled();
        });
    });

    describe('updateInquiry', () => {
        it('should update an inquiry', async () => {
            Inquiry.findByIdAndUpdate.mockResolvedValue({ _id: 'i1', status: 'resolved' });
            await PolicyService.updateInquiry('i1', { status: 'resolved' });
            expect(Inquiry.findByIdAndUpdate).toHaveBeenCalledWith('i1', { status: 'resolved' }, { new: true });
        });

        it('should throw if inquiry not found', async () => {
            Inquiry.findByIdAndUpdate.mockResolvedValue(null);
            await expect(PolicyService.updateInquiry('i1', {})).rejects.toThrow('Inquiry not found');
        });
    });

    describe('deleteInquiry', () => {
        it('should delete an inquiry', async () => {
            Inquiry.findByIdAndDelete.mockResolvedValue({ _id: 'i1' });
            await PolicyService.deleteInquiry('i1');
            expect(Inquiry.findByIdAndDelete).toHaveBeenCalledWith('i1');
        });

        it('should throw if inquiry not found', async () => {
            Inquiry.findByIdAndDelete.mockResolvedValue(null);
            await expect(PolicyService.deleteInquiry('i1')).rejects.toThrow('Inquiry not found');
        });
    });
});
