import NotificationService from '../../../src/core/Services/NotificationService.js';
import Vendor from '../../../src/core/Models/Vendor.js';
import User from '../../../src/core/Models/User.js';
import { cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { jest } from '@jest/globals';
import nodemailer from 'nodemailer';

describe('NotificationService Test Suite', () => {
    let vendorId, userId;

    beforeEach(async () => {
        await cleanDatabase();
        vendorId = generateId();
        userId = generateId();
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_EMAIL = 'test@test.com';
        jest.clearAllMocks();
    });

    describe('notifyVendorApproval', () => {
        it('should send email and SMS on approval', async () => {
            const mockUser = await User.create({ 
                _id: userId, 
                email: 'v@test.com', 
                phone: '123', 
                role: 'vendor', 
                identifier: 'v@test.com' 
            });
            await Vendor.create({ _id: vendorId, user: userId, businessName: 'Himalayas', status: 'pending' });

            const spyEmail = jest.spyOn(NotificationService, 'sendEmail').mockResolvedValue({});
            const spySMS = jest.spyOn(NotificationService, 'sendSMS').mockResolvedValue({});

            await NotificationService.notifyVendorApproval(vendorId, true);

            expect(spyEmail).toHaveBeenCalled();
            expect(spySMS).toHaveBeenCalled();
        });
    });

    describe('sendOTPEmail', () => {
        it('should use nodemailer to send OTP', async () => {
             const mockSendMail = jest.fn().mockResolvedValue({});
             jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail: mockSendMail });

             await NotificationService.sendOTPEmail('test@test.com', '123456');
             
             expect(mockSendMail).toHaveBeenCalled();
             expect(mockSendMail.mock.calls[0][0].subject).toContain('verification code');
        });
    });
});
