import AdminService from '../../src/services/AdminService.js';
import User from '../../src/models/User.js';
import Vendor from '../../src/models/Vendor.js';
import Booking from '../../src/models/Booking.js';
import mongoose from 'mongoose';

describe('AdminService', () => {
    describe('getDashboardStats', () => {
        it('should return aggregated stats correctly', async () => {
            // Create some test data
            await User.create({ name: 'User 1', role: 'traveller' });
            await User.create({ name: 'User 2', role: 'traveller' });

            const vendorUser = await User.create({ name: 'Vendor 1', role: 'vendor' });
            await Vendor.create({
                user: vendorUser._id,
                businessName: 'Biz 1',
                category: ['Trekking'],
                isApproved: true,
                documents: {
                    aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                    panCard: { url: 'http://test.com/pan.jpg' },
                    businessRegistration: { url: 'http://test.com/biz.jpg' },
                    gstRegistration: { url: 'http://test.com/gst.jpg' }
                }
            });

            const booking = await Booking.create({
                user: new mongoose.Types.ObjectId(),
                package: new mongoose.Types.ObjectId(),
                totalPrice: 1000,
                travelDate: new Date(),
                paymentStatus: 'paid',
                refundStatus: 'none'
            });

            const stats = await AdminService.getDashboardStats();

            expect(stats.users).toBe(2);
            expect(stats.vendors).toBe(1);
            expect(stats.bookings).toBe(1);
            expect(stats.revenue).toBe(1000);
        });
    });

    describe('approveVendor', () => {
        it('should mark a vendor as approved', async () => {
            const vendor = await Vendor.create({
                user: new mongoose.Types.ObjectId(),
                businessName: 'Pending Biz',
                category: ['Homestay'],
                isApproved: false,
                documents: {
                    aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                    panCard: { url: 'http://test.com/pan.jpg' },
                    businessRegistration: { url: 'http://test.com/biz.jpg' },
                    gstRegistration: { url: 'http://test.com/gst.jpg' }
                }
            });

            const updated = await AdminService.approveVendor(vendor._id);
            expect(updated.isApproved).toBe(true);

            const fetched = await Vendor.findById(vendor._id);
            expect(fetched.isApproved).toBe(true);
        });
    });

    describe('getAllTravellers', () => {
        it('should return only users with traveller role', async () => {
            await User.create({ name: 'Traveller', role: 'traveller' });
            await User.create({ name: 'Vendor', role: 'vendor' });
            await User.create({ name: 'Admin', role: 'admin' });

            const travellers = await AdminService.getAllTravellers();
            expect(travellers.length).toBe(1);
            expect(travellers[0].name).toBe('Traveller');
        });
    });
});
