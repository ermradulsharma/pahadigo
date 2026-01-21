const UserController = require('../../src/controllers/UserController');
const Package = require('../../src/models/Package');
const Vendor = require('../../src/models/Vendor');
const mongoose = require('mongoose');

describe('User API Integration', () => {
    let pkgId;
    let userId;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId();
        const vendor = await Vendor.create({
            user: new mongoose.Types.ObjectId(),
            businessName: 'Travel Co',
            category: 'Trekking',
            isApproved: true
        });

        const pkg = await Package.create({
            vendor: vendor._id,
            title: 'Himalayan Adventure',
            price: 10000,
            description: 'Test',
            duration: '4 Days'
        });
        pkgId = pkg._id;
    });

    it('should book a package when authenticated', async () => {
        const req = {
            user: { id: userId, role: 'user' },
            json: async () => ({
                packageId: pkgId,
                travelDate: '2025-06-01'
            })
        };

        const response = await UserController.bookPackage(req);
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Booking created');
        expect(response.data.booking).toBeDefined();
    });

    it('should return 401 if not authenticated', async () => {
        const req = {
            json: async () => ({ packageId: pkgId, travelDate: '2025-06-01' })
        };

        const response = await UserController.bookPackage(req);
        expect(response.status).toBe(401);
        expect(response.data.error).toBe('Unauthorized');
    });
});
