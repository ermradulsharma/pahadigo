import { jest } from '@jest/globals';

const mockUserFindById = jest.fn();
const mockGetUserById = jest.fn();
const mockGetBusinessBy = jest.fn();

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findById: mockUserFindById
    }
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getUserById: mockGetUserById,
    getBusinessBy: mockGetBusinessBy,
    getBusinessById: jest.fn(),
    getBusinessByIdAndUserId: jest.fn()
}));

const {
    userPayload,
    userPayloadMini,
    userDetailsPayload,
    userProfileById,
    userBusinessProfileById,
    userBusinessPayload,
    userAuthResponse,
    default: userProfileHelperDefault
} = await import('@/core/Helpers/userProfileHelper.js');

const { USER_ROLES, VENDOR_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: User Profile Helper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('userPayload', () => {
        it('should return null if user is falsy or lacks ID', () => {
            expect(userPayload(null)).toBeNull();
            expect(userPayload({})).toBeNull();
        });

        it('should format a valid user object properly', () => {
            const rawUser = {
                _id: 'user_123',
                name: 'Pahadi Traveller',
                email: 'traveller@pahadigo.com',
                phone: '9876543210',
                profileImage: 'https://cdn.example.com/pic.jpg',
                gender: 'male',
                dateOfBirth: '1995-05-15T00:00:00.000Z',
                address: {
                    city: 'Dehradun',
                    state: 'Uttarakhand',
                    location: { type: 'Point', coordinates: [78.0322, 30.3165] }
                },
                rating: 4.8,
                status: 'active',
                isVerified: true,
                experience: 5,
                designation: 'Trek Guide',
                bio: 'Passionate Himalayan explorer'
            };

            const formatted = userPayload(rawUser);
            expect(formatted.id).toBe('user_123');
            expect(formatted.name).toBe('Pahadi Traveller');
            expect(formatted.email).toBe('traveller@pahadigo.com');
            expect(formatted.dateOfBirth).toBe('1995-05-15');
            expect(formatted.experience).toBe(5);
        });

        it('should support u.id if _id is not present', () => {
            const raw = { id: 'alt_id_456', name: 'Alt User' };
            const formatted = userPayload(raw);
            expect(formatted.id).toBe('alt_id_456');
        });
    });

    describe('userPayloadMini', () => {
        it('should return null if userId is missing or user not found', async () => {
            expect(await userPayloadMini(null)).toBeNull();
            mockGetUserById.mockResolvedValue(null);
            expect(await userPayloadMini('non_existent')).toBeNull();
        });

        it('should return mini payload when user exists', async () => {
            mockGetUserById.mockResolvedValue({
                _id: 'user_mini_1',
                name: 'Mini User',
                profileImage: 'mini.png'
            });

            const res = await userPayloadMini('user_mini_1');
            expect(res).toEqual({
                id: 'user_mini_1',
                name: 'Mini User',
                profileImage: 'mini.png'
            });
        });
    });

    describe('userDetailsPayload', () => {
        it('should return null if user is null or missing id', () => {
            expect(userDetailsPayload(null)).toBeNull();
            expect(userDetailsPayload({})).toBeNull();
        });

        it('should return basic contact payload', () => {
            const res = userDetailsPayload({
                _id: 'u_101',
                name: 'Direct Contact',
                email: 'contact@example.com',
                phone: '9998887776',
                profileImage: 'pic.jpg'
            });
            expect(res).toEqual({
                id: 'u_101',
                name: 'Direct Contact',
                email: 'contact@example.com',
                phone: '9998887776',
                profileImage: 'pic.jpg'
            });
        });
    });

    describe('userProfileById', () => {
        it('should return null if id is not passed or user does not exist', async () => {
            expect(await userProfileById(null)).toBeNull();
        });

        it('should fetch lean user without password and format payload', async () => {
            const mockChain = {
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue({
                    _id: 'db_user_1',
                    name: 'DB User',
                    email: 'db@user.com'
                })
            };
            mockUserFindById.mockReturnValue(mockChain);

            const res = await userProfileById('db_user_1');
            expect(mockUserFindById).toHaveBeenCalledWith('db_user_1');
            expect(mockChain.select).toHaveBeenCalledWith('-password');
            expect(res.id).toBe('db_user_1');
            expect(res.name).toBe('DB User');
        });
    });

    describe('userBusinessProfileById & userBusinessPayload', () => {
        it('should return user with attached businessDetails', async () => {
            const mockChain = {
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue({
                    _id: 'vendor_user_1',
                    name: 'Vendor Owner',
                    role: USER_ROLES.VENDOR
                })
            };
            mockUserFindById.mockReturnValue(mockChain);

            mockGetBusinessBy.mockResolvedValue({
                _id: 'vendor_biz_1',
                businessName: 'Himalayan Homestays'
            });

            const res = await userBusinessProfileById('vendor_user_1');
            expect(res.id).toBe('vendor_user_1');
            expect(res.businessDetails).toBeDefined();
            expect(res.businessDetails.businessName).toBe('Himalayan Homestays');
        });

        it('should return null if base user is invalid', () => {
            expect(userBusinessPayload(null)).toBeNull();
        });
    });

    describe('userAuthResponse', () => {
        it('should return null if user is null', async () => {
            expect(await userAuthResponse(null)).toBeNull();
        });

        it('should build complete mobile auth profile with business status', async () => {
            mockGetBusinessBy.mockResolvedValue({
                _id: 'biz_auth_1',
                businessName: 'Camp Himalayan',
                profileStatus: 'active'
            });

            const userDoc = {
                _id: 'u_auth_1',
                name: 'Authenticated User',
                role: USER_ROLES.VENDOR,
                googleId: 'g_123',
                fcmToken: 'fcm_xyz',
                preferences: { tempRole: 'traveller' }
            };

            const res = await userAuthResponse(userDoc);
            expect(res.id).toBe('u_auth_1');
            expect(res.googleId).toBe('g_123');
            expect(res.role).toBe(USER_ROLES.VENDOR);
            expect(res.tempRole).toBe('traveller');
            expect(res.businessProfile).toBeDefined();
        });

        it('should assign SET_PROFILE status for vendors without created business profile', async () => {
            mockGetBusinessBy.mockResolvedValue(null);

            const userDoc = {
                _id: 'u_vendor_nobiz',
                name: 'New Vendor',
                role: USER_ROLES.VENDOR
            };

            const res = await userAuthResponse(userDoc);
            expect(res.businessProfileStatus).toBe(VENDOR_STATUS.SET_PROFILE);
        });
    });

    describe('default export verification', () => {
        it('should export all methods on default export', () => {
            expect(userProfileHelperDefault.userPayload).toBe(userPayload);
            expect(userProfileHelperDefault.userAuthResponse).toBe(userAuthResponse);
        });
    });
});
