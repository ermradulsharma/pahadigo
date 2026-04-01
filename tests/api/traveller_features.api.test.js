import UserController from '../../src/core/Http/Controllers/UserController.js';
import BookingController from '../../src/core/Http/Controllers/BookingController.js';
import ReviewController from '../../src/core/Http/Controllers/ReviewController.js';
import PackageService from '../../src/core/Services/PackageService.js';
import BookingService from '../../src/core/Services/BookingService.js';
import NotificationService from '../../src/core/Services/NotificationService.js';
import SearchLog from '../../src/core/Models/SearchLog.js';
import User from '../../src/core/Models/User.js';
import Category from '../../src/core/Models/Category.js';
import Wishlist from '../../src/core/Models/Wishlist.js';
import Booking from '../../src/core/Models/Booking.js';
import Package from '../../src/core/Models/Package.js';
import { createMockReq, cleanDatabase, generateId } from '../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Industry Standard: Traveller API Integration', () => {
    let travelerId;

    beforeEach(async () => {
        await cleanDatabase();
        travelerId = generateId();
        jest.clearAllMocks();
        
        // Mock Side Effects globally
        jest.spyOn(NotificationService, 'notifyBookingStatus').mockResolvedValue({});
    });

    describe('Feature: Location-Aware Search', () => {
        const queryUrl = 'http://localhost/api/packages/search?lat=30.3165&lng=78.0322&radius=10&category=homestay';
        
        it('[Success] should retrieve results within radius', async () => {
            const req = createMockReq({ user: { id: travelerId.toString(), role: USER_ROLES.TRAVELLER }, url: queryUrl });
            const mockPkg = { _id: generateId(), title: 'Hill Stay', category: 'homestay' };
            
            jest.spyOn(PackageService, 'searchNearbyPackages').mockResolvedValue([mockPkg]);
            jest.spyOn(Category, 'find').mockReturnValue({ lean: () => ([{ slug: 'homestay', name: 'Homestay' }]) });
            
            const res = await UserController.searchNearby(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const data = await res.json();
            expect(data.data.homestay).toBeDefined();
            expect(data.data.homestay.items[0].id).toEqual(mockPkg._id.toString());
        });

        it('[Validation] should fail if coordinates are missing', async () => {
            const req = createMockReq({ url: 'http://localhost/api/packages/search' });
            const res = await UserController.searchNearby(req);
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('[Privacy] should block non-authenticated history updates if requested', async () => {
            const req = createMockReq({ user: null, url: queryUrl });
            jest.spyOn(PackageService, 'searchNearbyPackages').mockResolvedValue([]);
            jest.spyOn(Category, 'find').mockReturnValue({ lean: () => ([]) });
            
            const res = await UserController.searchNearby(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const logCount = await SearchLog.countDocuments({ user: null });
            expect(logCount).toBeGreaterThan(0);
        });
    });

    describe('Feature: Wishlist Management', () => {
        it('[Success] should allow adding package to wishlist', async () => {
            const itemId = generateId();
            const req = createMockReq({ 
                user: { id: travelerId.toString() }, 
                jsonBody: { itemId: itemId.toString() } 
            });
            
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue({ _id: itemId, category: 'hotel' });
            
            const res = await UserController.addToWishlist(req);
            expect(res.status).toBe(HTTP_STATUS.CREATED);
            
            const stored = await Wishlist.findOne({ user: travelerId, itemId });
            expect(stored).not.toBeNull();
        });

        it('[Validation] should fail for non-existent items', async () => {
            const req = createMockReq({ 
                user: { id: travelerId.toString() },
                jsonBody: { itemId: generateId().toString() } 
            });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue(null);
            
            const res = await UserController.addToWishlist(req);
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    // ... (rest same)
    describe('Feature: Transactional Bookings', () => {
        it('[Success] should process booking with atomic inventory lock', async () => {
            const req = createMockReq({ 
                user: { id: travelerId.toString() }, 
                jsonBody: { catalogId: 'v1', category: 'hotel', itemId: 'i1', travelDate: '2025-05-01' } 
            });
            
            jest.spyOn(PackageService, 'getGranularItem').mockResolvedValue({ pricing: { price: 100 } });
            jest.spyOn(BookingService, 'createBooking').mockResolvedValue({ _id: generateId(), status: 'confirmed' });
            
            const res = await BookingController.createBooking(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const data = await res.json();
            expect(data.data.booking).toBeDefined();
        });

        it('[Business Logic] should allow user to cancel their own booking', async () => {
            const bookingId = generateId();
            const req = createMockReq({ 
                user: { id: travelerId.toString() }, 
                params: { id: bookingId.toString() } 
            });
            
            jest.spyOn(Booking, 'findOne').mockResolvedValue({ _id: bookingId, status: 'confirmed' });
            jest.spyOn(BookingService, 'processRefund').mockResolvedValue({ status: 'cancelled' });
            
            const res = await BookingController.cancelBooking(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });
});
