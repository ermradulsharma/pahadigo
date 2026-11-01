import { packageItemResponse } from '@/core/Helpers/Package/packageResponse.js';

describe('Helpers: Package/packageResponse', () => {
    it('should return null when item is null or undefined', () => {
        expect(packageItemResponse(null)).toBeNull();
        expect(packageItemResponse(undefined)).toBeNull();
    });

    it('should correctly format basic item details and pricing fallbacks', () => {
        const item = {
            _id: 'pkg_item_001',
            title: 'Himalayan Luxury Cottage',
            isActive: true,
            pricing: {
                basePrice: 3500,
                sellingPrice: 3800
            },
            location: {
                address: 'Dharamkot, Dharamshala',
                coordinates: [76.32, 32.25]
            },
            photos: [{ url: 'https://cdn.pahadigo.com/cottage.jpg' }]
        };

        const category = {
            id: 'cat_cottage',
            name: 'Homestay',
            slug: 'homestay'
        };

        const res = packageItemResponse(item, category);
        expect(res.id).toBe('pkg_item_001');
        expect(res.title).toBe('Himalayan Luxury Cottage');
        expect(res.category_name).toBe('Homestay');
        expect(res.category_slug).toBe('homestay');
        expect(res.category_id).toBe('cat_cottage');
        expect(res.pricing.basePrice).toBe(3500);
        expect(res.pricing.gst).toBe(18); // Default fallback
        expect(res.pricing.sellingPrice).toBe(3800);
        expect(res.photos).toBe('https://cdn.pahadigo.com/cottage.jpg');
        expect(res.location).toEqual([76.32, 32.25]);
    });

    it('should handle review stats provided as a Map', () => {
        const item = {
            _id: 'item_map_test',
            title: 'Riverside Retreat'
        };
        const statsMap = new Map();
        statsMap.set('item_map_test', { sum: 45, count: 10 });

        const res = packageItemResponse(item, {}, statsMap);
        expect(res.rating.average).toBe(4.5);
        expect(res.rating.count).toBe(10);
    });

    it('should handle review stats provided as an array aggregation result', () => {
        const item = {
            _id: 'item_arr_test',
            title: 'Camp Paraglide',
            rating: [{ average: '4.8', count: 25 }]
        };

        const res = packageItemResponse(item);
        expect(res.rating.average).toBe(4.8);
        expect(res.rating.count).toBe(25);
    });

    it('should handle review stats provided as a plain object', () => {
        const item = {
            _id: 'item_obj_test',
            title: 'Ski Lodge',
            rating: { average: 4.2, count: 6 }
        };

        const res = packageItemResponse(item);
        expect(res.rating.average).toBe(4.2);
        expect(res.rating.count).toBe(6);
    });

    it('should attach extra fields such as wishlist flag', () => {
        const item = {
            _id: 'item_extra_test',
            title: 'Pine Forest Cabin'
        };

        const res = packageItemResponse(item, {}, null, { wishlist: true });
        expect(res.wishlist).toBe(true);
    });
});

