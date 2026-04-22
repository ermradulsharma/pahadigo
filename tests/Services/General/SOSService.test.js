import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/User.js', () => ({
    default: {
        findByIdAndUpdate: jest.fn()
    }
}));

const { default: SOSService } = await import('@/services/General/SOSService.js');
const { default: User } = await import('@/models/User.js');

describe('Industry Standard: SOSService Business Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Validation] should throw error if contacts exceed limit (5)', async () => {
        const tooManyContacts = [{}, {}, {}, {}, {}, {}];
        await expect(SOSService.updateEmergencyContacts('u123', tooManyContacts))
            .rejects.toThrow();
    });

    it('[Persistence] should update emergency contacts in user profile', async () => {
        const validContacts = [{ name: 'Dad', phone: '123' }];
        User.findByIdAndUpdate.mockResolvedValue({ _id: 'u123', emergencyContacts: validContacts });

        const result = await SOSService.updateEmergencyContacts('u123', validContacts);

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'u123',
            { $set: { emergencyContacts: validContacts } },
            expect.any(Object)
        );
        expect(result.emergencyContacts).toHaveLength(1);
    });
});
