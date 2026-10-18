import { jest } from '@jest/globals';
import {
    getById,
    getBy,
    getManyBy,
    updateById,
    deleteById,
    getUserBy,
    getUserById,
    getUsersBy,
    getBookingBy,
    getBookingById,
    getBookingsBy,
    getPackageBy,
    getPackageById,
    getPackagesBy,
    getVendorsBy
} from '@/core/Helpers/queryHelpers.js';

describe('queryHelpers Data Access Layer (DAL) Tests', () => {
    let mockQuery;
    let MockModel;

    beforeEach(() => {
        mockQuery = {
            select: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            session: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ _id: 'doc_123', name: 'PahadiGo Himalayan Trek' })
        };

        MockModel = {
            findById: jest.fn().mockReturnValue(mockQuery),
            findOne: jest.fn().mockReturnValue(mockQuery),
            find: jest.fn().mockReturnValue(mockQuery),
            findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery),
            findByIdAndDelete: jest.fn().mockReturnValue(mockQuery)
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getById', () => {
        it('should return null if id is not provided', async () => {
            const res = await getById(MockModel, null);
            expect(res).toBeNull();
            expect(MockModel.findById).not.toHaveBeenCalled();
        });

        it('should execute findById with lean and select by default', async () => {
            const res = await getById(MockModel, 'doc_123', 'name email');
            expect(MockModel.findById).toHaveBeenCalledWith('doc_123');
            expect(mockQuery.select).toHaveBeenCalled();
            expect(mockQuery.lean).toHaveBeenCalled();
            expect(mockQuery.exec).toHaveBeenCalled();
            expect(res).toEqual({ _id: 'doc_123', name: 'PahadiGo Himalayan Trek' });
        });

        it('should omit lean when options.lean is false', async () => {
            await getById(MockModel, 'doc_123', '', null, { lean: false });
            expect(mockQuery.lean).not.toHaveBeenCalled();
            expect(mockQuery.exec).toHaveBeenCalled();
        });

        it('should attach session when options.session is supplied', async () => {
            const mockSession = { id: 'sess_999' };
            await getById(MockModel, 'doc_123', '', null, { session: mockSession });
            expect(mockQuery.session).toHaveBeenCalledWith(mockSession);
        });
    });

    describe('getBy', () => {
        it('should return null if conditions are empty or missing', async () => {
            const res = await getBy(MockModel, {});
            expect(res).toBeNull();
            expect(MockModel.findOne).not.toHaveBeenCalled();
        });

        it('should execute findOne with criteria and chaining', async () => {
            const res = await getBy(MockModel, { email: 'traveller@pahadigo.co.in' }, 'name role', 'vendor');
            expect(MockModel.findOne).toHaveBeenCalledWith({ email: 'traveller@pahadigo.co.in' });
            expect(mockQuery.populate).toHaveBeenCalledWith('vendor');
            expect(mockQuery.lean).toHaveBeenCalled();
            expect(res).toEqual({ _id: 'doc_123', name: 'PahadiGo Himalayan Trek' });
        });
    });

    describe('getManyBy', () => {
        it('should execute find with sorting, projection, and lean', async () => {
            mockQuery.exec.mockResolvedValueOnce([{ _id: 'doc_1' }, { _id: 'doc_2' }]);
            const res = await getManyBy(MockModel, { status: 'active' }, 'title price', null, { createdAt: -1 });
            expect(MockModel.find).toHaveBeenCalledWith({ status: 'active' });
            expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(mockQuery.lean).toHaveBeenCalled();
            expect(res).toHaveLength(2);
        });
    });

    describe('updateById', () => {
        it('should return null if id is not provided', async () => {
            const res = await updateById(MockModel, null, { name: 'Updated' });
            expect(res).toBeNull();
            expect(MockModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        it('should call findByIdAndUpdate with new: true and lean', async () => {
            mockQuery.exec.mockResolvedValueOnce({ _id: 'doc_123', name: 'Updated' });
            const res = await updateById(MockModel, 'doc_123', { name: 'Updated' });
            expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith('doc_123', { name: 'Updated' }, expect.objectContaining({ new: true }));
            expect(mockQuery.lean).toHaveBeenCalled();
            expect(res).toEqual({ _id: 'doc_123', name: 'Updated' });
        });
    });

    describe('deleteById', () => {
        it('should return null if id is not provided', async () => {
            const res = await deleteById(MockModel, null);
            expect(res).toBeNull();
            expect(MockModel.findByIdAndDelete).not.toHaveBeenCalled();
        });

        it('should call findByIdAndDelete with provided id', async () => {
            mockQuery.exec.mockResolvedValueOnce({ _id: 'doc_123', deleted: true });
            const res = await deleteById(MockModel, 'doc_123');
            expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith('doc_123', {});
            expect(res).toEqual({ _id: 'doc_123', deleted: true });
        });
    });

    describe('Convenience wrappers', () => {
        it('should export all role and entity-specific convenience wrappers', () => {
            expect(typeof getUserBy).toBe('function');
            expect(typeof getUserById).toBe('function');
            expect(typeof getUsersBy).toBe('function');
            expect(typeof getBookingBy).toBe('function');
            expect(typeof getBookingById).toBe('function');
            expect(typeof getBookingsBy).toBe('function');
            expect(typeof getPackageBy).toBe('function');
            expect(typeof getPackageById).toBe('function');
            expect(typeof getPackagesBy).toBe('function');
            expect(typeof getVendorsBy).toBe('function');
        });
    });
});
