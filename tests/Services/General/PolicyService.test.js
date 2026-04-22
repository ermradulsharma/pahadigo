import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/Policy.js', () => ({
    default: {
        find: jest.fn(),
        findOne: jest.fn()
    }
}));

jest.unstable_mockModule('@/models/Inquiry.js', () => ({
    default: {
        create: jest.fn()
    }
}));

const { default: PolicyService } = await import('@/services/General/PolicyService.js');
const { default: Policy } = await import('@/models/Policy.js');
const { default: Inquiry } = await import('@/models/Inquiry.js');

describe('Industry Standard: PolicyService Business Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Policies] should fetch all policies or filtered by target', async () => {
        Policy.find.mockResolvedValue([{ type: 'privacy' }]);
        const result = await PolicyService.getPolicies('traveller');
        expect(Policy.find).toHaveBeenCalledWith({ target: 'traveller' });
        expect(result).toHaveLength(1);
    });

    it('[Inquiry] should record new support inquiry from public', async () => {
        const dummyData = { name: 'Gaurav', email: 'g@test.com', message: 'Help' };
        Inquiry.create.mockResolvedValue({ _id: 'i123', ...dummyData });

        const result = await PolicyService.submitInquiry(dummyData);
        expect(Inquiry.create).toHaveBeenCalledWith(dummyData);
        expect(result._id).toBe('i123');
    });
});
