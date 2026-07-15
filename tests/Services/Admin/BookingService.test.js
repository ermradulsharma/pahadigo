import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock External Services
const mockRazorpay = { createRefund: jest.fn() };
const mockNotification = { sendInvoice: jest.fn() };
const mockAudit = { logAction: jest.fn() };

jest.unstable_mockModule('@/core/Services/General/RazorpayService.js', () => ({ default: mockRazorpay }));
jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({ default: mockNotification }));
jest.unstable_mockModule('@/core/Services/Admin/AuditService.js', () => ({ default: mockAudit }));
jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({ getAppConfig: jest.fn().mockResolvedValue({ razorpay: {} }) }));

const { default: BookingService } = await import('@/core/Services/Admin/BookingService.js');
const { default: Booking } = await import('@/core/Models/Booking.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Dispute } = await import('@/core/Models/Dispute.js');

describe('Industry Standard: BookingService Payout Logic', () => {
    let testUser;
    let testVendor;
    let testBooking;

    beforeEach(async () => {
        // Seed a Test User
        testUser = await User.create({
            name: "Test Auditor",
            email: `test_${Date.now()}@test.com`,
            password: "password123",
            role: 'traveller'
        });

        // Seed a Test Vendor with full bank credentials
        testVendor = await Vendor.create({
            user: testUser._id,
            ownerName: "Rajesh PayoutTest",
            businessName: "Pahadi Go Adventures",
            businessEmail: "test@pahadigo.co.in",
            phone: "9999999999",
            bankDetails: {
                accountHolderName: "Rajesh PayoutTest",
                accountNumber: "1234567890",
                ifscCode: "IFSC0001234",
                bankName: "Test Bank of India"
            },
            status: 'active'
        });

        // Seed a Test Booking targeting the above vendor
        testBooking = await Booking.create({
            bookingCode: "TEST-PAYOUT-001",
            user: testUser._id,
            vendor: testVendor._id,
            package: new mongoose.Types.ObjectId(),
            item: {
                itemId: new mongoose.Types.ObjectId(),
                itemType: 'package',
                title: "River Rafting Special"
            },
            pricing: {
                basePrice: 5000,
                subTotal: 5000,
                total: 5500,
                currency: 'INR'
            },
            status: 'confirmed',
            paymentStatus: 'paid',
            startDate: new Date(),
            endDate: new Date()
        });
    });

    it('[Snapshot] should correctly archive vendor credentials during payout execution', async () => {
        const payoutData = {
            bookingId: testBooking._id,
            transactionId: "TXN_SNAPSHOT_TEST_123",
            note: "Audit snapshot test execution"
        };

        const result = await BookingService.payoutBooking(payoutData);

        // Verify top-level status
        expect(result.payout.status).toBe('paid');
        expect(result.payout.amount).toBe(5000); // Should use basePrice if amount not provided
        expect(result.payout.transactionId).toBe("TXN_SNAPSHOT_TEST_123");

        // Verify SNAPSHOT integrity (The Core Requirement)
        expect(result.payout.businessName).toBe("Pahadi Go Adventures");
        expect(result.payout.ownerName).toBe("Rajesh PayoutTest");
        expect(result.payout.bankDetails.accountNumber).toBe("1234567890");
        expect(result.payout.bankDetails.ifscCode).toBe("IFSC0001234");
        expect(result.payout.bankDetails.bankName).toBe("Test Bank of India");
        
        // Verify cross-reference consistency
        const freshRecord = await Booking.findById(testBooking._id);
        expect(freshRecord.payout.status).toBe('paid');
    });

    it('[Automation] should fallback to basePrice if explicit amount is missing', async () => {
        const result = await BookingService.payoutBooking({ 
            bookingId: testBooking._id 
        });
        
        expect(result.payout.amount).toBe(5000); // Matches pricing.basePrice
    });
    
    it('[Legacy] should handle missing vendor relation gracefully', async () => {
        const orphanBooking = await Booking.create({
            bookingCode: "ORPHAN-001",
            user: new mongoose.Types.ObjectId(),
            package: new mongoose.Types.ObjectId(),
            vendor: new mongoose.Types.ObjectId(), // Dummy ID that doesn't exist in DB
            item: {
                itemId: new mongoose.Types.ObjectId(),
                itemType: 'package',
                title: "Orphan Service"
            },
            pricing: { 
                basePrice: 1000, 
                subTotal: 1000,
                total: 1100 
            },
            status: 'confirmed',
            paymentStatus: 'paid',
            startDate: new Date(),
            endDate: new Date()
        });
        
        const result = await BookingService.payoutBooking({ bookingId: orphanBooking._id });
        expect(result.payout.status).toBe('paid');
        expect(result.payout.businessName).toBeFalsy(); // No vendor to snapshot (null/undefined)
    });

    describe('Refund Pipeline', () => {
        it('should execute full refund flow via Razorpay', async () => {
            testBooking.payment.paymentId = "pay_test_123";
            await testBooking.save();

            mockRazorpay.createRefund.mockResolvedValue({ id: "rfnd_test_123" });

            const refundData = {
                bookingId: testBooking._id,
                amount: 5000,
                reason: "Customer requested cancellation"
            };

            const result = await BookingService.refundBooking(refundData);

            expect(result.status).toBe('cancelled');
            expect(result.paymentStatus).toBe('refunded');
            expect(result.pricing.refundId).toBe("rfnd_test_123");
            expect(mockRazorpay.createRefund).toHaveBeenCalledWith("pay_test_123", 5000, expect.any(Object));
        });

        it('should block refund if booking is not paid', async () => {
            testBooking.paymentStatus = 'pending';
            await testBooking.save();

            await expect(BookingService.refundBooking({ bookingId: testBooking._id }))
                .rejects.toThrow("Only paid or refund-pending bookings can be refunded");
        });
    });

    describe('Dispute Resolution', () => {
        it('should mark dispute as resolved with admin notes', async () => {
            const testDispute = await Dispute.create({
                bookingId: testBooking._id,
                user: testUser._id,
                traveller: testUser._id,
                vendor: testVendor._id,
                reason: "quality_issue",
                description: "The quality of service was poor.",
                status: 'open'
            });

            const result = await BookingService.resolveDispute(
                new mongoose.Types.ObjectId(), 
                testDispute._id, 
                'resolved_refunded', 
                "Refund issued to customer"
            );

            expect(result.status).toBe('resolved_refunded');
            expect(result.adminNotes).toBe("Refund issued to customer");
            expect(result.resolvedAt).toBeDefined();
        });
    });

    describe('Invoicing Pipeline', () => {
        it('should trigger notification service and update timeline', async () => {
            await BookingService.generateAndSendInvoice(testBooking._id);

            expect(mockNotification.sendInvoice).toHaveBeenCalled();
            
            const updatedBooking = await Booking.findById(testBooking._id);
            const invoiceEntry = updatedBooking.timeline.find(t => t.status === 'Invoice Dispatched');
            expect(invoiceEntry).toBeDefined();
        });
    });
});
