import UserController from '../../src/core/Http/Controllers/UserController.js';
import Package from '../../src/core/Models/Package.js';
import Vendor from '../../src/core/Models/Vendor.js';
import mongoose from 'mongoose';
import { USER_ROLES } from '../../src/core/Constants/index.js';

describe('User API Integration', () => {
    let pkgId;
    let userId;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId();
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Travel Co',
            category: [{ _id: new mongoose.Types.ObjectId(), name: 'Trekking', slug: 'trekking' }],
            isApproved: true,
            bankDetails: {
                accountHolderName: 'Test Vendor',
                accountNumber: '1234567890',
                ifscCode: 'SBIN0001234',
                bankName: 'SBI',
                cancelledCheque: { url: 'http://test.com/cheque.jpg' }
            },
            documents: {
                aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                panCard: { url: 'http://test.com/pan.jpg' },
                businessRegistration: { url: 'http://test.com/biz.jpg' },
                gstRegistration: { url: 'http://test.com/gst.jpg' }
            }
        });

        const pkg = await Package.create({
            vendor: vendor._id,
            trekking: [{
                title: 'Himalayan Adventure',
                description: 'A great adventure',
                pricing: { pricePerPerson: 10000 },
                details: {
                    trekType: 'Day Trek',
                    duration: '4 Days'
                },
                location: { address: 'Himalayas' }
            }]
        });
        pkgId = pkg._id;
    });

    it('should book a package when authenticated', async () => {
        const req = {
            user: { id: userId, role: USER_ROLES.TRAVELLER },
            jsonBody: {
                packageId: pkgId,
                travelDate: '2025-06-01'
            }
        };

        const response = await UserController.bookPackage(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Booking created successfully');
        expect(data.data.booking).toBeDefined();
    });

    it('should return 401 if not authenticated', async () => {
        const req = {
            jsonBody: { packageId: pkgId, travelDate: '2025-06-01' }
        };

        const response = await UserController.bookPackage(req);
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('Unauthorized access');
    });

    it('should fetch and search packages successfully', async () => {
        const req = {
            // Mocking Next.js request URL params
            url: new URL('http://localhost:3000/api/user/packages?q=Himalayan&type=trekking')
        };

        const response = await UserController.browsePackages(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Packages retrieved successfully');
        expect(data.data.packages).toBeDefined();
        // Should find our seeded 'Himalayan Adventure' trek
        expect(data.data.packages.length).toBeGreaterThan(0);
    });
});
