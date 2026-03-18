import VendorController from '../../src/core/Http/Controllers/VendorController.js';
import User from '../../src/core/Models/User.js';
import Vendor from '../../src/core/Models/Vendor.js';
import Category from '../../src/core/Models/Category.js';
import VendorService from '../../src/core/Services/VendorService.js';
import PackageService from '../../src/core/Services/PackageService.js';
import CategoryService from '../../src/core/Services/CategoryService.js';
import AuthService from '../../src/core/Services/AuthService.js';
import * as cloudinary from '../../src/core/Helpers/cloudinary.js';
import mongoose from 'mongoose';
import { USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('Vendor API Integration (Controller Layer)', () => {
    let mockReq;
    beforeEach(() => {
        mockReq = {
            jsonBody: {},
            user: { role: 'vendor', id: new mongoose.Types.ObjectId().toString() },
            headers: new Map(),
            json: async function() { return this.jsonBody; },
            formDataBody: {
                get: () => null,
                entries: () => [['key', 'value']]
            }
        };
        mockReq.headers.get = (key) => { return null; };
        jest.clearAllMocks();
    });

    describe('Business Profile', () => {
        it('getBusinessProfile denies access to non-vendors', async () => {
             mockReq.user.role = 'traveller';
             const res = await VendorController.getBusinessProfile(mockReq);
             expect(res.status).toBe(403);
        });

        it('getBusinessProfile not found', async () => {
             jest.spyOn(VendorService, 'getFullProfile').mockResolvedValue(null);
             const res = await VendorController.getBusinessProfile(mockReq);
             expect(res.status).toBe(404);
        });

        it('getBusinessProfile succeeds', async () => {
             jest.spyOn(VendorService, 'getFullProfile').mockResolvedValue({});
             const res = await VendorController.getBusinessProfile(mockReq);
             expect(res.status).toBe(200);
        });

        it('getBusinessProfile error', async () => {
             jest.spyOn(VendorService, 'getFullProfile').mockRejectedValue(new Error('fails'));
             const res = await VendorController.getBusinessProfile(mockReq);
             expect(res.status).toBe(500);
        });

        it('createBusinessProfile missing form data', async () => {
             mockReq.formDataBody = null;
             const res = await VendorController.createBusinessProfile(mockReq);
             expect(res.status).toBe(400);
        });

        it('createBusinessProfile handles required fields', async () => {
             mockReq.formDataBody = { get: () => null, entries: () => [] }; // mock basic map
             const res = await VendorController.createBusinessProfile(mockReq);
             expect(res.status).toBe(500); // fails down the line
        });

        it('updateBusinessProfile missing form data', async () => {
             mockReq.formDataBody = null;
             const res = await VendorController.updateBusinessProfile(mockReq);
             expect(res.status).toBe(400);
        });

        it('deleteBusinessProfile succeeds', async () => {
             jest.spyOn(VendorService, 'deleteProfile').mockResolvedValue(true);
             const res = await VendorController.deleteBusinessProfile(mockReq);
             expect(res.status).toBe(200);
        });

        it('deleteBusinessProfile error', async () => {
             jest.spyOn(VendorService, 'deleteProfile').mockRejectedValue(new Error('fail'));
             const res = await VendorController.deleteBusinessProfile(mockReq);
             expect(res.status).toBe(500);
        });
    });

    describe('Business Documents', () => {
        it('getBusinessDocuments fails if vendor missing', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.getBusinessDocuments(mockReq);
             expect(res.status).toBe(404);
        });

        it('getBusinessDocuments succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.getBusinessDocuments(mockReq);
             expect(res.status).toBe(200);
        });

        it('getBusinessDocuments error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('fail'));
             const res = await VendorController.getBusinessDocuments(mockReq);
             expect(res.status).toBe(500);
        });

        it('uploadBusinessDocuments requires form data', async () => {
             jest.spyOn(Vendor, 'findOne').mockResolvedValue({});
             const res = await VendorController.uploadBusinessDocuments(mockReq);
             expect(res.status).toBe(400);
        });

        it('uploadBusinessDocuments missing vendor', async () => {
             jest.spyOn(Vendor, 'findOne').mockResolvedValue(null);
             const res = await VendorController.uploadBusinessDocuments(mockReq);
             expect(res.status).toBe(404);
        });
        
        it('uploadBusinessDocuments error', async () => {
             jest.spyOn(Vendor, 'findOne').mockRejectedValue(new Error('f'));
             const res = await VendorController.uploadBusinessDocuments(mockReq);
             expect(res.status).toBe(500);
        });

        it('updateBusinessDocument missing form data', async () => {
             const res = await VendorController.updateBusinessDocument(mockReq);
             expect(res.status).toBe(400);
        });

        it('updateBusinessDocument error', async () => {
             mockReq.formDataBody = { 
                  get: () => 'fake_file', 
                  entries: () => [['type', 'panCard']] 
             };
             const res = await VendorController.updateBusinessDocument(mockReq);
             expect(res.status).toBe(500);
        });

        it('deleteBusinessDocument missing type', async () => {
             const res = await VendorController.deleteBusinessDocument(mockReq);
             expect(res.status).toBe(400);
        });

        it('deleteBusinessDocument succeeds', async () => {
             mockReq.jsonBody = { type: 'panCard' };
             jest.spyOn(Vendor, 'findOneAndUpdate').mockResolvedValue({});
             const res = await VendorController.deleteBusinessDocument(mockReq);
             expect(res.status).toBe(200);
        });

        it('deleteBusinessDocument error', async () => {
             mockReq.jsonBody = { type: 'panCard' };
             jest.spyOn(Vendor, 'findOneAndUpdate').mockRejectedValue(new Error('f'));
             const res = await VendorController.deleteBusinessDocument(mockReq);
             expect(res.status).toBe(500);
        });
    });

    describe('Bank Details', () => {
        it('getBankDetails missing', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.getBankDetails(mockReq);
             expect(res.status).toBe(404);
        });

        it('getBankDetails succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.getBankDetails(mockReq);
             expect(res.status).toBe(200);
        });
        
        it('getBankDetails error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('f'));
             const res = await VendorController.getBankDetails(mockReq);
             expect(res.status).toBe(500);
        });

        it('createBankDetails missing form data', async () => {
             mockReq.formDataBody = null;
             const res = await VendorController.createBankDetails(mockReq);
             expect(res.status).toBe(400);
        });

        it('deleteBankDetails succeeds', async () => {
             jest.spyOn(VendorService, 'deleteBankDetails').mockResolvedValue({});
             const res = await VendorController.deleteBankDetails(mockReq);
             expect(res.status).toBe(200);
        });

        it('deleteBankDetails error', async () => {
             jest.spyOn(VendorService, 'deleteBankDetails').mockRejectedValue(new Error('f'));
             const res = await VendorController.deleteBankDetails(mockReq);
             expect(res.status).toBe(500);
        });
    });

    describe('Packages', () => {
        it('getPackages missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.getPackages(mockReq);
             expect(res.status).toBe(400);
        });

        it('getPackages succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: '1' });
             jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
             const res = await VendorController.getPackages(mockReq);
             expect(res.status).toBe(200);
        });

        it('getPackages error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('f'));
             const res = await VendorController.getPackages(mockReq);
             expect(res.status).toBe(500);
        });

        it('createPackage missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.createPackage(mockReq);
             expect(res.status).toBe(400);
        });

        it('createPackage missing fields', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.createPackage(mockReq);
             expect(res.status).toBe(400);
        });

        it('createPackage succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: '1' });
             mockReq.jsonBody = { title: 'T', price: 10 };
             jest.spyOn(PackageService, 'createPackage').mockResolvedValue({});
             const res = await VendorController.createPackage(mockReq);
             expect(res.status).toBe(201);
        });

        it('createPackage error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('f'));
             const res = await VendorController.createPackage(mockReq);
             expect(res.status).toBe(500);
        });
    });

    describe('Package Items', () => {
         it('addItem missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.addItem(mockReq);
             expect(res.status).toBe(400);
         });

         it('addItem error mapping', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.addItem(mockReq);
             expect(res.status).toBe(400);
         });

         it('updateItem missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.updateItem(mockReq);
             expect(res.status).toBe(400);
         });
         
         it('updateItem missing fields', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.updateItem(mockReq);
             expect(res.status).toBe(400);
         });

         it('deleteItem missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.deleteItem(mockReq);
             expect(res.status).toBe(400);
         });

         it('deleteItem missing fields', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.deleteItem(mockReq);
             expect(res.status).toBe(400);
         });
         
         it('deleteItem succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             mockReq.jsonBody = { category: 'hotel', itemId: '1' };
             jest.spyOn(PackageService, 'removeServiceItem').mockResolvedValue();
             jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
             const res = await VendorController.deleteItem(mockReq);
             expect(res.status).toBe(200);
         });
         
         it('deleteItem error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('f'));
             const res = await VendorController.deleteItem(mockReq);
             expect(res.status).toBe(500);
         });

         it('toggleItemStatus missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.toggleItemStatus(mockReq);
             expect(res.status).toBe(400);
         });
         
         it('toggleItemStatus missing fields', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.toggleItemStatus(mockReq);
             expect(res.status).toBe(400);
         });

         it('toggleItemStatus succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             mockReq.jsonBody = { category: 'hotel', itemId: '1', isActive: true };
             jest.spyOn(PackageService, 'toggleItemStatus').mockResolvedValue();
             jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
             const res = await VendorController.toggleItemStatus(mockReq);
             expect(res.status).toBe(200);
         });

         it('toggleItemStatus error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('f'));
             const res = await VendorController.toggleItemStatus(mockReq);
             expect(res.status).toBe(500);
         });
         
         it('toggleCategoryStatus missing vendor', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
             const res = await VendorController.toggleCategoryStatus(mockReq);
             expect(res.status).toBe(400);
         });
         
         it('toggleCategoryStatus missing fields', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             const res = await VendorController.toggleCategoryStatus(mockReq);
             expect(res.status).toBe(400);
         });
         
         it('toggleCategoryStatus succeeds', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({});
             mockReq.jsonBody = { category: 'hotel', isActive: true };
             jest.spyOn(PackageService, 'toggleCategoryStatus').mockResolvedValue();
             jest.spyOn(PackageService, 'getFormattedVendorCatalog').mockResolvedValue([]);
             const res = await VendorController.toggleCategoryStatus(mockReq);
             expect(res.status).toBe(200);
         });

         it('toggleCategoryStatus error', async () => {
             jest.spyOn(VendorService, 'findByUserId').mockRejectedValue(new Error('f'));
             const res = await VendorController.toggleCategoryStatus(mockReq);
             expect(res.status).toBe(500);
         });
    });

    // Legacy Category functions
    describe('Legacy Categories', () => {
         it('getBusinessCategories', async () => {
             jest.spyOn(CategoryService, 'getAllCategories').mockResolvedValue([]);
             const res = await VendorController.getBusinessCategories(mockReq);
             expect(res.status).toBe(200);
         });

         it('addBusinessCategory missing slug', async () => {
             const res = await VendorController.addBusinessCategory(mockReq);
             expect(res.status).toBe(400);
         });

         it('addBusinessCategory not found', async () => {
             mockReq.jsonBody = { categorySlug: 'fake' };
             jest.spyOn(Category, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
             const res = await VendorController.addBusinessCategory(mockReq);
             expect(res.status).toBe(404);
         });

         it('addBusinessCategory succeeds', async () => {
             mockReq.jsonBody = { categorySlug: 'hotel' };
             jest.spyOn(Category, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: '1', name: 'hotel', slug: 'hotel' }) });
             jest.spyOn(VendorService, 'addCategory').mockResolvedValue({});
             const res = await VendorController.addBusinessCategory(mockReq);
             expect(res.status).toBe(200);
         });

         it('addBusinessCategory error', async () => {
              mockReq.jsonBody = { categorySlug: 'hotel' };
              jest.spyOn(Category, 'findOne').mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('f')) });
              const res = await VendorController.addBusinessCategory(mockReq);
              expect(res.status).toBe(500);
         });

         it('removeBusinessCategory missing slug', async () => {
              const res = await VendorController.removeBusinessCategory(mockReq);
              expect(res.status).toBe(400);
         });

         it('removeBusinessCategory succeeds', async () => {
              mockReq.jsonBody = { categorySlug: 'hotel' };
              jest.spyOn(VendorService, 'removeCategory').mockResolvedValue({});
              const res = await VendorController.removeBusinessCategory(mockReq);
              expect(res.status).toBe(200);
         });

         it('removeBusinessCategory error', async () => {
              mockReq.jsonBody = { categorySlug: 'hotel' };
              jest.spyOn(VendorService, 'removeCategory').mockRejectedValue(new Error('f'));
              const res = await VendorController.removeBusinessCategory(mockReq);
              expect(res.status).toBe(500);
         });
    });
});
