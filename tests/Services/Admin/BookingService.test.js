import BookingService from '@/services/Admin/BookingService';
import Booking from '@/models/Booking';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import mongoose from 'mongoose';

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
            businessEmail: "test@pahadigo.com",
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
            user: new mongoose.Types.ObjectId(),
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
});
