import VendorController from '../../../src/core/Http/Controllers/VendorController.js';
import VendorService from '../../../src/core/Services/VendorService.js';
import PackageService from '../../../src/core/Services/PackageService.js';
import BookingService from '../../../src/core/Services/BookingService.js';
import Category from '../../../src/core/Models/Category.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import VendorStatusService from '../../../src/core/Services/VendorStatusService.js';
import mongoose from 'mongoose';

describe('Industry Standard: Vendor Operations API', () => {
    let userId;
    let vendorId;

    beforeEach(async () => {
        await cleanDatabase();
        userId = generateId();
        vendorId = generateId();
        jest.clearAllMocks();
    });

    describe('Feature: Business Identity', () => {
        it('[Success] should retrieve full business profile with metrics', async () => {
            const req = createMockReq({ user: { id: userId.toString(), role: USER_ROLES.VENDOR } });
            jest.spyOn(VendorService, 'getFullProfile').mockResolvedValue({ _id: vendorId, businessName: 'Himalayan Tours' });
            
            const res = await VendorController.getBusinessProfile(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const body = await res.json();
            expect(body.data.businessName).toBe('Himalayan Tours');
        });
    });

    describe('Feature: Catalog Lifecycle', () => {
        beforeEach(() => {
            jest.spyOn(VendorStatusService, 'isVendorAllowedToOperate').mockResolvedValue({ 
                allowed: true, 
                vendor: { _id: vendorId.toString() } 
            });
        });

        it('[Success] should add a new categorized service item', async () => {
            const req = createMockReq({ 
                user: { id: userId.toString() },
                jsonBody: { category: 'hotel', item: { title: 'Suite Room', price: 5000 } } 
            });
            
            // Return string for better comparison matching
            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId.toString() });
            jest.spyOn(PackageService, 'addServiceItem').mockResolvedValue({});
            jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
            
            const res = await VendorController.addItem(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(PackageService.addServiceItem).toHaveBeenCalledWith(vendorId.toString(), 'hotel', { title: 'Suite Room', price: 5000 });
        });

        it('[Consistency] should toggle service status and refresh catalog', async () => {
             const itemId = generateId();
             const req = createMockReq({ 
                 user: { id: userId.toString() },
                 jsonBody: { category: 'trekking', itemId: itemId.toString(), isActive: false } 
             });
             
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId.toString() });
             jest.spyOn(PackageService, 'toggleItemStatus').mockResolvedValue({});
             jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
             
             const res = await VendorController.toggleItemStatus(req);
             expect(res.status).toBe(HTTP_STATUS.OK);
             expect(PackageService.toggleItemStatus).toHaveBeenCalledWith(vendorId.toString(), 'trekking', itemId.toString(), false);
        });

        it('[Success] should delete an item from the catalog', async () => {
            const itemId = generateId();
            const req = createMockReq({ 
                user: { id: userId.toString() },
                jsonBody: { category: 'hotel', itemId: itemId.toString() } 
            });
            
            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId.toString() });
            jest.spyOn(PackageService, 'removeServiceItem').mockResolvedValue({});
            jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
            
            const res = await VendorController.deleteItem(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(PackageService.removeServiceItem).toHaveBeenCalledWith(vendorId.toString(), 'hotel', itemId.toString());
        });
    });

    describe('Feature: Booking Monitoring', () => {
        it('[Success] should fetch paginated bookings for assigned vendor', async () => {
            const req = createMockReq({ user: { id: userId.toString() } });
            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId.toString() });
            jest.spyOn(BookingService, 'getVendorBookings').mockResolvedValue([{ bookingId: 'B1' }]);
            
            const res = await VendorController.getBookings(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.getVendorBookings).toHaveBeenCalledWith(vendorId.toString());
        });
    });

    describe('Feature: Service Expansion', () => {
        it('[Success] should allow vendor to register interest in a category', async () => {
            const req = createMockReq({ user: { id: userId.toString() }, jsonBody: { categorySlug: 'skiing' } });
            
            jest.spyOn(Category, 'findOne').mockReturnValue({ 
                select: () => ({ _id: generateId().toString(), name: 'Skiing', slug: 'skiing' }) 
            });
            jest.spyOn(VendorService, 'addCategory').mockResolvedValue({});
            
            const res = await VendorController.addBusinessCategory(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(VendorService.addCategory).toHaveBeenCalled();
        });
    });
});
