import { jest } from '@jest/globals';

const mockUser = {
    findById: jest.fn()
};

const mockBaseAuthService = {
    updateUserProfile: jest.fn()
};

const mockSOSService = {
    updateEmergencyContacts: jest.fn(),
    triggerSOS: jest.fn()
};

const mockCloudinary = {
    uploadToCloudinary: jest.fn()
};

const mockHelpers = {
    userAuthResponse: jest.fn(),
    getUserById: jest.fn(),
    getBusinessById: jest.fn(),
    getPackageBy: jest.fn(),
    itemsFormate: jest.fn(),
    businessPayload: jest.fn(),
    transformAuthResponse: jest.fn((u) => u)
};

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: mockUser
}));

jest.unstable_mockModule('@/core/Services/Auth/index.js', () => ({
    BaseAuthService: mockBaseAuthService
}));

jest.unstable_mockModule('@/core/Services/General/SOSService.js', () => ({
    default: mockSOSService
}));

jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => mockCloudinary);

jest.unstable_mockModule('@/core/Helpers/index.js', () => mockHelpers);

const { default: ProfileController } = await import('@/core/Http/Controllers/Auth/User/ProfileController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: Auth User ProfileController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            user: { id: 'user_session_123' },
            payload: {}
        };
    });

    it('[getProfile] should return authenticated user profile', async () => {
        mockUser.findById.mockResolvedValue({ _id: 'user_session_123', name: 'John Doe' });
        mockHelpers.userAuthResponse.mockResolvedValue({ id: 'user_session_123', name: 'John Doe' });

        const res = await ProfileController.getProfile(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockUser.findById).toHaveBeenCalledWith('user_session_123');
        expect(mockHelpers.userAuthResponse).toHaveBeenCalled();
    });

    it('[toggleAccountStatus] should toggle account status correctly', async () => {
        const fakeUser = {
            _id: 'user_session_123',
            status: 'pending',
            isVerified: true,
            save: jest.fn().mockResolvedValue(true)
        };
        mockUser.findById.mockResolvedValue(fakeUser);
        mockReq.payload = { status: true };

        const res = await ProfileController.toggleAccountStatus(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(fakeUser.status).toBe('active');
        expect(fakeUser.save).toHaveBeenCalled();
    });

    it('[updateProfile] should sanitize fields and update profile via BaseAuthService', async () => {
        mockReq.payload = {
            name: 'Updated Name',
            bio: 'Hiker and Adventurer',
            unallowedSecretField: 'hack'
        };
        mockBaseAuthService.updateUserProfile.mockResolvedValue({
            id: 'user_session_123',
            name: 'Updated Name',
            bio: 'Hiker and Adventurer'
        });

        const res = await ProfileController.updateProfile(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockBaseAuthService.updateUserProfile).toHaveBeenCalledWith(
            'user_session_123',
            expect.objectContaining({ name: 'Updated Name', bio: 'Hiker and Adventurer' })
        );
        expect(mockBaseAuthService.updateUserProfile).not.toHaveBeenCalledWith(
            'user_session_123',
            expect.objectContaining({ unallowedSecretField: 'hack' })
        );
    });

    it('[updateProfileImage] should reject if no profile image file is provided', async () => {
        mockReq.payload = {};
        const res = await ProfileController.updateProfileImage(mockReq);
        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('[updateProfileImage] should upload to cloudinary and update user profile', async () => {
        mockReq.payload = { profileImage: 'data:image/png;base64,...' };
        mockCloudinary.uploadToCloudinary.mockResolvedValue({ url: 'https://cloudinary.com/avatar.png' });
        mockBaseAuthService.updateUserProfile.mockResolvedValue({
            id: 'user_session_123',
            profileImage: 'https://cloudinary.com/avatar.png'
        });

        const res = await ProfileController.updateProfileImage(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockCloudinary.uploadToCloudinary).toHaveBeenCalled();
        expect(mockBaseAuthService.updateUserProfile).toHaveBeenCalledWith(
            'user_session_123',
            { profileImage: 'https://cloudinary.com/avatar.png' }
        );
    });

    it('[updateEmergencyContacts] should update contacts array via SOSService', async () => {
        mockReq.payload = {
            emergencyContact: [{ name: 'Dad', phone: '9876543210', relationship: 'Father' }]
        };
        mockSOSService.updateEmergencyContacts.mockResolvedValue(true);

        const res = await ProfileController.updateEmergencyContacts(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockSOSService.updateEmergencyContacts).toHaveBeenCalledWith(
            'user_session_123',
            mockReq.payload.emergencyContact
        );
    });

    it('[triggerSOS] should invoke SOSService trigger', async () => {
        mockReq.payload = { latitude: 30.3165, longitude: 78.0322 };
        mockSOSService.triggerSOS.mockResolvedValue({ _id: 'alert_1', status: 'active' });

        const res = await ProfileController.triggerSOS(mockReq);
        expect(res.status).toBe(HTTP_STATUS.CREATED);
        expect(mockSOSService.triggerSOS).toHaveBeenCalledWith(
            'user_session_123',
            mockReq.payload
        );
    });
});
