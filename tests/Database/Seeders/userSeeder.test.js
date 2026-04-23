import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

const { default: seedUsers } = await import('@/database/Seeders/userSeeder.js');
const { default: User } = await import('@/core/Models/User.js');

describe('Industry Standard: userSeeder Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should seed default users if they do not exist', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({});

        const result = await seedUsers();

        expect(User.create).toHaveBeenCalled();
        expect(result.count).toBeGreaterThan(0);
    });

    it('[Success] should skip existing users', async () => {
        User.findOne.mockResolvedValue({ _id: 'u1' });
        User.create.mockResolvedValue({});

        await seedUsers();

        expect(User.create).not.toHaveBeenCalled();
    });
});
