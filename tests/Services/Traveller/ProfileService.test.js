import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { default: ProfileService } = await import('@/services/Traveller/ProfileService.js');
const { default: User } = await import('@/core/Models/User.js');
const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');

describe('Industry Standard: ProfileService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should be correctly instantiated by the core container', () => {
        expect(ProfileService).toBeDefined();
    });

    it('[Integrity] should expose standard service interface', () => {
        const exports = typeof ProfileService;
        expect(exports).toBe('object');
    });

    describe('Profile Updates', () => {
        it('[Success] should update name, phone, and mapped dob correctly', async () => {
            const user = await User.create({
                name: 'Old Name',
                phone: '1234567890',
                email: 'test@example.com',
                role: 'traveller'
            });

            const updated = await ProfileService.updateProfile(user._id, {
                name: 'New Name',
                phone: '9876543210',
                dob: new Date('1995-05-15'),
                password: 'hacked_password_attempt' // should be filtered out
            });

            expect(updated.name).toBe('New Name');
            expect(updated.phone).toBe('9876543210');
            expect(updated.dateOfBirth).toEqual(new Date('1995-05-15'));
            expect(updated.password).toBeUndefined();
        });

        it('[Success] should update profile image under profileImage property', async () => {
            const user = await User.create({
                name: 'Test User',
                email: 'avatar@test.com',
                role: 'traveller'
            });

            uploadToCloudinary.mockResolvedValue({ url: 'http://cloudinary.com/avatar.jpg' });

            const updated = await ProfileService.updateAvatar(user._id, 'mock-file-content');
            expect(uploadToCloudinary).toHaveBeenCalledWith('mock-file-content', `avatars/${user._id}`);
            expect(updated.profileImage).toBe('http://cloudinary.com/avatar.jpg');
        });
    });
});
