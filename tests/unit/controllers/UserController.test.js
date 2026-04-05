import UserController from '../../../src/core/Http/Controllers/UserController.js';
import PackageService from '../../../src/core/Services/PackageService.js';
import SearchLog from '../../../src/core/Models/SearchLog.js';
import Wishlist from '../../../src/core/Models/Wishlist.js';
import Category from '../../../src/core/Models/Category.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('UserController Test Suite', () => {
    let travelerId;

    beforeEach(async () => {
        await cleanDatabase();
        travelerId = generateId();
        jest.clearAllMocks();
    });

    describe('Feature: Package Browsing & Search', () => {
        it('[Success] should return categorized products', async () => {
            const req = createMockReq({ user: { id: travelerId.toString() } });
            jest.spyOn(PackageService, 'getAvailablePackagesByCategory').mockResolvedValue({ homestay: [] });
            
            const response = await UserController.browsePackages(req);
            const body = await response.json();
            
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toHaveProperty('homestay');
        });

        it('[Success] should retrieve results within radius (nearby search)', async () => {
            const queryUrl = 'http://localhost/api/packages/search?lat=30.3&lng=78.0&radius=10&category=homestay';
            const req = createMockReq({ user: { id: travelerId.toString() }, url: queryUrl });
            const mockPkg = { _id: generateId(), title: 'Hill Stay', category: 'homestay' };
            
            jest.spyOn(PackageService, 'searchNearbyPackages').mockResolvedValue([mockPkg]);
            jest.spyOn(Category, 'find').mockReturnValue({ lean: () => ([{ slug: 'homestay', name: 'Homestay' }]) });
            
            const res = await UserController.searchNearby(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            const data = await res.json();
            expect(data.data.homestay.items[0].title).toBe('Hill Stay');
        });
    });

    describe('Feature: Search History', () => {
        it('[Success] should retrieve and clear recent searches', async () => {
            const req = createMockReq({ user: { id: travelerId.toString() } });
            jest.spyOn(SearchLog, 'find').mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ([]) }) }) });
            
            await UserController.getRecentSearches(req);
            
            jest.spyOn(SearchLog, 'deleteMany').mockResolvedValue({ deletedCount: 1 });
            const clearRes = await UserController.clearRecentSearches(req);
            expect(clearRes.status).toBe(HTTP_STATUS.OK);
            expect(SearchLog.deleteMany).toHaveBeenCalledWith({ user: travelerId.toString() });
        });
    });

    describe('Feature: Wishlist Management', () => {
        it('[Success] should allow adding package to wishlist', async () => {
            const itemId = generateId();
            const req = createMockReq({ user: { id: travelerId.toString() }, jsonBody: { itemId: itemId.toString() } });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue({ _id: itemId, category: 'hotel' });
            
            const res = await UserController.addToWishlist(req);
            expect(res.status).toBe(HTTP_STATUS.CREATED);
            
            const stored = await Wishlist.findOne({ user: travelerId, itemId });
            expect(stored).not.toBeNull();
        });

        it('[Validation] should fail for non-existent items', async () => {
            const req = createMockReq({ user: { id: travelerId.toString() }, jsonBody: { itemId: generateId().toString() } });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue(null);
            
            const res = await UserController.addToWishlist(req);
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });
});
