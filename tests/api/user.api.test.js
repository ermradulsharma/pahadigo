import UserController from '../../src/core/Http/Controllers/UserController.js';
import BookingController from '../../src/core/Http/Controllers/BookingController.js';
import PackageService from '../../src/core/Services/PackageService.js';
import BookingService from '../../src/core/Services/BookingService.js';
import SearchLog from '../../src/core/Models/SearchLog.js';
import Wishlist from '../../src/core/Models/Wishlist.js';
import Category from '../../src/core/Models/Category.js';
import { createMockReq, cleanDatabase, generateId } from '../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Industry Standard: Traveller Core API', () => {
    let travelerId;

    beforeEach(async () => {
        await cleanDatabase();
        travelerId = generateId();
        jest.clearAllMocks();
    });

    describe('Feature: Package Browsing', () => {
        it('[Success] should return categorized products', async () => {
            const req = createMockReq({ user: { id: travelerId.toString() } });
            jest.spyOn(PackageService, 'getAvailablePackagesByCategory').mockResolvedValue({ homestay: [] });
            
            const response = await UserController.browsePackages(req);
            const body = await response.json();
            
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toHaveProperty('homestay');
        });
    });

    describe('Feature: Personal Search History', () => {
        it('[Success] should retrieve and clear recent searches', async () => {
            const req = createMockReq({ user: { id: travelerId.toString() } });
            jest.spyOn(SearchLog, 'find').mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ([]) }) }) });
            
            const listRes = await UserController.getRecentSearches(req);
            expect(listRes.status).toBe(HTTP_STATUS.OK);
            
            jest.spyOn(SearchLog, 'deleteMany').mockResolvedValue({ deletedCount: 1 });
            const clearRes = await UserController.clearRecentSearches(req);
            expect(clearRes.status).toBe(HTTP_STATUS.OK);
            expect(SearchLog.deleteMany).toHaveBeenCalledWith({ user: travelerId.toString() });
        });
    });

    describe('Feature: Engagement (Wishlist)', () => {
        it('[Integrity] should prevent adding invalid items to wishlist', async () => {
            const req = createMockReq({ user: { id: travelerId.toString() }, jsonBody: { itemId: generateId().toString() } });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue(null);
            
            const res = await UserController.addToWishlist(req);
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('Feature: Conversions (Booking)', () => {
        it('[Transactional] should create a booking with valid data', async () => {
            const req = createMockReq({ 
                user: { id: travelerId.toString() },
                jsonBody: { catalogId: 'v1', category: 'hotel', itemId: 'i1', travelDate: '2025-01-01' } 
            });
            
            jest.spyOn(PackageService, 'getGranularItem').mockResolvedValue({ pricing: { price: 100 } });
            jest.spyOn(BookingService, 'createBooking').mockResolvedValue({ _id: generateId() });
            
            const res = await BookingController.createBooking(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });
});
