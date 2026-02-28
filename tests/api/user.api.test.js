import UserController from '../../src/controllers/UserController.js';
import Package from '../../src/models/Package.js';
import Vendor from '../../src/models/Vendor.js';
import mongoose from 'mongoose';
import { USER_ROLES } from '../../src/constants/index.js';

describe('User API Integration', () => {
    let pkgId;
    let userId;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId();
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Travel Co',
            category: ['Trekking'],
            isApproved: true,
            documents: {
                aadharCard: [{ url: 'http://test.com/aadhar.jpg' }],
                panCard: { url: 'http://test.com/pan.jpg' },
                businessRegistration: { url: 'http://test.com/biz.jpg' },
                gstRegistration: { url: 'http://test.com/gst.jpg' }
            }
        });

        const pkg = await Package.create({
            vendor: vendor._id,
            services: {
                trekking: [{
                    trekkingName: 'Himalayan Adventure',
                    pricePerPerson: 10000,
                    duration: '4 Days',
                    location: 'Himalayas'
                }]
            }
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

        const response = await UserController.getPackages(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Success');
        expect(data.data.packages).toBeDefined();
        // Should find our seeded 'Himalayan Adventure' trek
        expect(data.data.packages.data.length).toBeGreaterThan(0);
    });
});
