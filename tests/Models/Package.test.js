import Package from '@/models/Package.js';
import { cleanDatabase, generateId } from '../Helpers/testUtils.js';

describe('Industry Standard: Package Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should create a vendor package with a sub-item', async () => {
        const pkgData = {
            user: generateId(),
            vendor: generateId(),
            trekking: [{
                title: 'Valley of Flowers',
                slug: 'valley-of-flowers',
                description: 'A beautiful trek',
                duration: { days: 5 },
                location: { address: 'Joshimath' }
            }]
        };
        const pkg = await Package.create(pkgData);
        expect(pkg.trekking).toHaveLength(1);
        expect(pkg.trekking[0].title).toBe('Valley of Flowers');
    });

    it('[Success] should enforce uniqueness on user/vendor fields', async () => {
        const userId = generateId();
        const vendorId = generateId();
        await Package.init();
        await Package.create({ user: userId, vendor: vendorId });
        
        let err;
        try {
            await Package.create({ user: userId, vendor: vendorId });
        } catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000); // Duplicate key error
    });
});
