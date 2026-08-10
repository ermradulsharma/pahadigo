import { jest } from '@jest/globals';

// We removed the unstable_mockModule for jwt.js to avoid conflicts in full test runs
// especially when running with --runInBand where ESM module caching can be tricky.

const { default: BaseAuthService } = await import('@/core/Services/Auth/BaseAuthService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');

describe('BaseAuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(User, 'findById');
        jest.spyOn(User, 'findByIdAndUpdate');
        jest.spyOn(Vendor, 'findOne');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getUserProfile', () => {
        test('should return user profile with vendor data if role is vendor', async () => {
            const mockUser = {
                _id: 'u1',
                role: 'vendor',
                toObject: () => ({ _id: 'u1', role: 'vendor' })
            };
            const mockVendor = { businessName: 'Test Biz' };

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockUser)
                })
            });
            Vendor.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockVendor)
            });

            const result = await BaseAuthService.getUserProfile('u1');

            expect(result._id).toBe('u1');
            expect(result.businessProfile).toEqual(mockVendor);
            expect(Vendor.findOne).toHaveBeenCalledWith({ user: 'u1' });
        });

        test('should throw error if user not found', async () => {
            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            });

            await expect(BaseAuthService.getUserProfile('u1')).rejects.toThrow();
        });
    });

    describe('updateUserProfile', () => {
        test('should update user successfully', async () => {
            const mockUser = { _id: 'u1', firstName: 'New' };
            User.findById.mockResolvedValue(mockUser);
            User.findByIdAndUpdate.mockResolvedValue(mockUser);

            const result = await BaseAuthService.updateUserProfile('u1', { firstName: 'New' });

            expect(result.firstName).toBe('New');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { firstName: 'New' }, expect.anything());
        });
    });

    describe('deactivateUserAccount', () => {
        test('should mark user as deleted', async () => {
            const mockUser = { _id: 'u1' };
            User.findByIdAndUpdate.mockResolvedValue(mockUser);

            const result = await BaseAuthService.deactivateUserAccount('u1', 'No longer needed');

            expect(result).toBe(true);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', expect.objectContaining({
                status: 'deleted',
                deletedReason: 'No longer needed'
            }), expect.anything());
        });
    });
});
