import VendorStatusService from '../../../src/core/Services/VendorStatusService.js';
import Vendor from '../../../src/core/Models/Vendor.js';
import User from '../../../src/core/Models/User.js';
import VendorClosure from '../../../src/core/Models/VendorClosure.js';
import { cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { STATUS } from '../../../src/core/Constants/index.js';
import mongoose from 'mongoose';

describe('VendorStatusService Test Suite', () => {
    let userId, vendorId;

    beforeEach(async () => {
        await cleanDatabase();
        userId = generateId();
        vendorId = generateId();
    });

    describe('canManageBusinessProfile', () => {
        it('should allow active vendors to manage profile', async () => {
            await User.create({ _id: userId, status: STATUS.ACTIVE, role: 'vendor', identifier: 'test@vendor.com' });
            
            const result = await VendorStatusService.canManageBusinessProfile(userId);
            expect(result.allowed).toBe(true);
        });

        it('should allow pending vendors to manage profile', async () => {
            await User.create({ _id: userId, status: STATUS.PENDING, role: 'vendor', identifier: 'test@vendor.com' });
            
            const result = await VendorStatusService.canManageBusinessProfile(userId);
            expect(result.allowed).toBe(true);
        });

        it('should block blocked vendors', async () => {
            await User.create({ _id: userId, status: STATUS.BLOCKED, role: 'vendor', identifier: 'test@vendor.com' });
            
            const result = await VendorStatusService.canManageBusinessProfile(userId);
            expect(result.allowed).toBe(false);
        });
    });

    describe('isVendorAllowedToOperate', () => {
        it('should allow active user with active business', async () => {
            await User.create({ _id: userId, status: STATUS.ACTIVE, identifier: 'v1@test.com' });
            await Vendor.create({ _id: vendorId, user: userId, status: STATUS.ACTIVE, businessName: 'Himalayas' });
            
            const result = await VendorStatusService.isVendorAllowedToOperate(userId);
            expect(result.allowed).toBe(true);
        });

        it('should block if business is blocked', async () => {
            await User.create({ _id: userId, status: STATUS.ACTIVE, identifier: 'v1@test.com' });
            await Vendor.create({ _id: vendorId, user: userId, status: STATUS.BLOCKED, businessName: 'Himalayas' });
            
            const result = await VendorStatusService.isVendorAllowedToOperate(userId);
            expect(result.allowed).toBe(false);
        });
    });

    describe('isVendorAvailable', () => {
        it('should return false during closure period', async () => {
            await User.create({ _id: userId, status: STATUS.ACTIVE, identifier: 'v@test.com' });
            const vendor = await Vendor.create({ _id: vendorId, user: userId, status: STATUS.ACTIVE, businessName: 'Himalayas' });
            
            const now = new Date();
            await VendorClosure.create({
                vendor: vendorId,
                user: userId,
                startDate: new Date(now.getTime()), // TODAY
                endDate: new Date(now.getTime() + 86400000), // TOMORROW
                isActive: true
            });

            const result = await VendorStatusService.isVendorAvailable(userId, true);
            expect(result).toBe(false);
        });

        it('should return true if no active closure', async () => {
             await User.create({ _id: userId, status: STATUS.ACTIVE, identifier: 'v@test.com' });
             await Vendor.create({ _id: vendorId, user: userId, status: STATUS.ACTIVE, businessName: 'Himalayas' });
             
             const result = await VendorStatusService.isVendorAvailable(userId, true);
             expect(result).toBe(true);
        });
    });
});
