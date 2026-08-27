import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        getBusinessProfile: jest.fn(),
        getBusinessByUserId: jest.fn(),
        syncBusinessProfile: jest.fn(),
        removeBusinessProfile: jest.fn(),
        toggleOperatingStatus: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getBusinessByUserId: jest.fn(),
    getBusinessById: jest.fn()
}));

jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn(),
    handleFormDataImageUpload: jest.fn()
}));

jest.unstable_mockModule('@/core/Events/VendorEvents.js', () => ({
    default: {
        emit: jest.fn()
    }
}));

const { default: BusinessController } = await import('@/core/Http/Controllers/Vendor/BusinessController.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const { getBusinessByUserId, getBusinessById } = await import('@/core/Helpers/queryHelpers.js');
const { uploadToCloudinary, handleFormDataImageUpload } = await import('@/core/Helpers/cloudinary.js');
const { default: VendorEvents } = await import('@/core/Events/VendorEvents.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Vendor BusinessController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return profile successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            BusinessService.getBusinessProfile.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.getProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.id).toBe('v1');
        });

        it('should return 404 if profile not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessByUserId.mockResolvedValue(null);
            BusinessService.getBusinessProfile.mockResolvedValue(null);

            const response = await BusinessController.getProfile(mockReq);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessByUserId.mockRejectedValue(new Error('DB error'));

            const response = await BusinessController.getProfile(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('createProfile', () => {
        it('should create a profile successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { name: 'Test' };
            getBusinessByUserId.mockResolvedValue(null);
            BusinessService.syncBusinessProfile.mockResolvedValue({ _id: 'v1', user: { email: 'a@b.com' } });

            const response = await BusinessController.createProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data.id).toBe('v1');
            expect(VendorEvents.emit).toHaveBeenCalledWith('vendor.profile_created', expect.any(Object));
        });

        it('should upload profile_image if present in formData', async () => {
            const formDataBody = new Map();
            formDataBody.set('profile_image', 'file');
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { name: 'Test' };
            mockReq.formDataBody = formDataBody;

            getBusinessByUserId.mockResolvedValue(null);
            handleFormDataImageUpload.mockResolvedValue('http://img.com/a.jpg');
            uploadToCloudinary.mockResolvedValue({ url: 'http://img.com/a.jpg' });
            BusinessService.syncBusinessProfile.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.createProfile(mockReq);

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(BusinessService.syncBusinessProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ profileImage: 'http://img.com/a.jpg' }));
        });

        it('should return 400 if profile already exists', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.createProfile(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessByUserId.mockRejectedValue(new Error('error'));

            const response = await BusinessController.createProfile(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('updateProfile', () => {
        it('should update profile successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { name: 'Test' };
            getBusinessById.mockResolvedValue({ _id: 'v1', user: 'u1' });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1', user: 'u1' });
            BusinessService.syncBusinessProfile.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.updateProfile(mockReq, { params: { id: 'v1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        it('should upload profile image and update', async () => {
            const formDataBody = new Map();
            formDataBody.set('profile_image', 'file');
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { name: 'Test' };
            mockReq.formDataBody = formDataBody;

            getBusinessById.mockResolvedValue({ _id: 'v1', user: 'u1' });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1', user: 'u1' });
            handleFormDataImageUpload.mockResolvedValue('http://img.com/b.jpg');
            uploadToCloudinary.mockResolvedValue({ url: 'http://img.com/b.jpg' });
            BusinessService.syncBusinessProfile.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.updateProfile(mockReq, { params: { id: 'v1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BusinessService.syncBusinessProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ profileImage: 'http://img.com/b.jpg' }));
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessById.mockRejectedValue(new Error('err'));
            const response = await BusinessController.updateProfile(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('deleteProfile', () => {
        it('should delete profile successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessById.mockResolvedValue({ _id: 'v1', user: 'u1' });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1', user: 'u1' });
            BusinessService.removeBusinessProfile.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.deleteProfile(mockReq, { params: { id: 'v1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessById.mockRejectedValue(new Error('err'));
            const response = await BusinessController.deleteProfile(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('updateOperatingStatus', () => {
        it('should update status successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { isOperating: true };
            getBusinessById.mockResolvedValue({ _id: 'v1', user: 'u1' });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1', user: 'u1' });
            BusinessService.toggleOperatingStatus.mockResolvedValue({ _id: 'v1' });

            const response = await BusinessController.updateOperatingStatus(mockReq, { params: { id: 'v1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BusinessService.toggleOperatingStatus).toHaveBeenCalledWith('u1', true);
        });

        it('should return 400 if isOperating is missing', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            getBusinessById.mockResolvedValue({ _id: 'v1', user: 'u1' });
            getBusinessByUserId.mockResolvedValue({ _id: 'v1', user: 'u1' });
            mockReq.payload = {};
            const response = await BusinessController.updateOperatingStatus(mockReq, { params: { id: 'v1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { isOperating: true };
            getBusinessById.mockRejectedValue(new Error('err'));
            const response = await BusinessController.updateOperatingStatus(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });
});
