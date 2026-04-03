import NotificationService from '../../src/core/Services/NotificationService.js';
import User from '../../src/core/Models/User.js';
import Vendor from '../../src/core/Models/Vendor.js';
import Booking from '../../src/core/Models/Booking.js';
import Package from '../../src/core/Models/Package.js';
import { USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';


describe('NotificationService', () => {
    
    beforeEach(async () => {
        await User.deleteMany({});
        await Vendor.deleteMany({});
        await Booking.deleteMany({});
        jest.clearAllMocks();
    });

    describe('sendEmail', () => {
        it('should log mock message if SMTP not configured', async () => {
             const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
             await NotificationService.sendEmail('test@e.com', 'Sub', 'Msg');
             expect(spy).toHaveBeenCalledWith(expect.stringContaining('[MOCK EMAIL]'));
             spy.mockRestore();
        });
    });

    describe('notifyVendorApproval', () => {
        it('should trigger notifications for approved vendor', async () => {
            const user = await User.create({ email: 'v@e.com', role: 'vendor', fcmTokens: ['f1'] });
            const vendor = await Vendor.create({ user: user._id, businessName: 'V1' });

            const emailSpy = jest.spyOn(NotificationService, 'sendEmail').mockResolvedValue(true);
            const smsSpy = jest.spyOn(NotificationService, 'sendSMS').mockResolvedValue(true);
            const pushSpy = jest.spyOn(NotificationService, 'sendPushNotification').mockResolvedValue(true);

            await NotificationService.notifyVendorApproval(vendor._id, true);

            expect(emailSpy).toHaveBeenCalled();
            expect(pushSpy).toHaveBeenCalled();

            emailSpy.mockRestore();
            smsSpy.mockRestore();
            pushSpy.mockRestore();
        });
    });

    describe('notifyBookingStatus', () => {
        it('should notify admin and vendor on confirmed booking', async () => {
             const adminUser = await User.create({ email: 'a@e.com', role: 'admin' });
             const vendorUser = await User.create({ email: 'v@e.com', role: 'vendor' });
             const vendor = await Vendor.create({ user: vendorUser._id, businessName: 'V1' });
             
             const pkg = await Package.create({
                 vendor: vendor._id,
                 title: 'Test Pkg',
                 accommodation: [{ title: 'Room' }]
             });

             const booking = await Booking.create({
                 user: vendorUser._id, // Just for test
                 vendor: vendor._id,
                 package: pkg._id,
                 totalPrice: 1000,
                 status: 'confirmed',
                 travelStartTime: new Date(),
                 travelEndTime: new Date(Date.now() + 86400000)
             });

             const emailSpy = jest.spyOn(NotificationService, 'sendEmail').mockResolvedValue(true);
             
             await NotificationService.notifyBookingStatus(booking._id, 'confirmed');

             // Confirmed should notify admin, vendor, and traveller
             // So at least 2 emails (vendor, admin) plus one for traveler?
             expect(emailSpy).toHaveBeenCalledTimes(3);

             emailSpy.mockRestore();
        });
    });
});
