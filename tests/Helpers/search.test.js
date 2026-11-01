import { parseQuery, notificationParseQuery, formatPackageItem } from '@/core/Helpers/search.js';

describe('Helpers: search', () => {
    describe('parseQuery', () => {
        it('should parse defaults when empty or minimal url is provided', () => {
            const result = parseQuery('https://pahadigo.co.in/packages');
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.minPrice).toBe(0);
            expect(result.maxPrice).toBeNull();
            expect(result.sort).toBe('');
            expect(result.query).toBe('');
            expect(result.category).toBe('');
            expect(result.lat).toBeNull();
            expect(result.lng).toBeNull();
            expect(result.radius).toBe(50);
            expect(result.address).toBe('');
        });

        it('should correctly parse pagination and price parameters', () => {
            const url = 'https://pahadigo.co.in/packages?page=3&limit=20&minPrice=500&maxPrice=5000';
            const result = parseQuery(url);
            expect(result.page).toBe(3);
            expect(result.limit).toBe(20);
            expect(result.minPrice).toBe(500);
            expect(result.maxPrice).toBe(5000);
        });

        it('should handle limit=all correctly as limit 0', () => {
            const url = 'https://pahadigo.co.in/packages?limit=all';
            const result = parseQuery(url);
            expect(result.limit).toBe(0);
        });

        it('should fallback gracefully on invalid numeric parameters', () => {
            const url = 'https://pahadigo.co.in/packages?page=-5&limit=invalid&minPrice=abc&maxPrice=xyz&radius=bad';
            const result = parseQuery(url);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.minPrice).toBe(0);
            expect(result.maxPrice).toBeNull();
            expect(result.radius).toBe(50);
        });

        it('should parse query strings, categories, and coordinates', () => {
            const url = 'https://pahadigo.co.in/packages?q=Rishikesh+Rafting&category=RAFTING&lat=30.0869&lng=78.2676&radius=25';
            const result = parseQuery(url);
            expect(result.query).toBe('Rishikesh Rafting');
            expect(result.category).toBe('rafting');
            expect(result.lat).toBe(30.0869);
            expect(result.lng).toBe(78.2676);
            expect(result.radius).toBe(25);
        });

        it('should support alternative query params like latitude, longitude, and city', () => {
            const url = 'https://pahadigo.co.in/packages?query=Homestay&latitude=29.3803&longitude=79.4636&city=Nainital';
            const result = parseQuery(url);
            expect(result.query).toBe('Homestay');
            expect(result.lat).toBe(29.3803);
            expect(result.lng).toBe(79.4636);
            expect(result.address).toBe('Nainital');
        });

        it('should accept a URL instance directly', () => {
            const urlObj = new URL('https://pahadigo.co.in/packages?page=2');
            const result = parseQuery(urlObj);
            expect(result.page).toBe(2);
        });
    });

    describe('notificationParseQuery', () => {
        it('should parse default notification pagination', () => {
            const result = notificationParseQuery('https://pahadigo.co.in/notifications');
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should parse custom page and limit', () => {
            const result = notificationParseQuery('https://pahadigo.co.in/notifications?page=4&limit=25');
            expect(result.page).toBe(4);
            expect(result.limit).toBe(25);
        });

        it('should support limit=all', () => {
            const result = notificationParseQuery('https://pahadigo.co.in/notifications?limit=all');
            expect(result.limit).toBe(0);
        });
    });

    describe('formatPackageItem', () => {
        it('should return null when item is falsy', () => {
            expect(formatPackageItem(null)).toBeNull();
            expect(formatPackageItem(undefined)).toBeNull();
        });

        it('should format standard package item with category and pricing info', () => {
            const rawItem = {
                _id: 'item_123',
                title: 'Mountain View Homestay',
                isActive: true,
                pricing: {
                    basePrice: 2000,
                    gst: 12,
                    sellingPrice: 2240
                },
                location: {
                    address: 'Mall Road, Manali',
                    coordinates: [77.1892, 32.2432]
                },
                photos: ['https://example.com/photo1.jpg']
            };

            const categoryInfo = {
                id: 'cat_01',
                name: 'Homestay',
                slug: 'homestay'
            };

            const formatted = formatPackageItem(rawItem, categoryInfo);
            expect(formatted.id).toBe('item_123');
            expect(formatted.title).toBe('Mountain View Homestay');
            expect(formatted.isActive).toBe(true);
            expect(formatted.pricing.basePrice).toBe(2000);
            expect(formatted.pricing.gst).toBe(12);
            expect(formatted.pricing.sellingPrice).toBe(2240);
            expect(formatted.category_name).toBe('Homestay');
            expect(formatted.category_slug).toBe('homestay');
            expect(formatted.category_id).toBe('cat_01');
            expect(formatted.photos).toBe('https://example.com/photo1.jpg');
            expect(formatted.location).toEqual([77.1892, 32.2432]);
        });

        it('should calculate rating stats from a Map of review statistics', () => {
            const rawItem = {
                _id: 'item_456',
                title: 'Riverside Camp',
                pricing: { basePrice: 1500, sellingPrice: 1500 }
            };

            const reviewMap = new Map();
            reviewMap.set('item_456', { sum: 18, count: 4 });

            const formatted = formatPackageItem(rawItem, {}, reviewMap);
            expect(formatted.rating.count).toBe(4);
            expect(formatted.rating.average).toBe(4.5);
        });

        it('should extract rating stats from an object or nested reviews', () => {
            const rawItem = {
                _id: 'item_789',
                title: 'Valley Trek',
                reviews: { average: 4.8, count: 12 }
            };

            const formatted = formatPackageItem(rawItem);
            expect(formatted.rating.average).toBe(4.8);
            expect(formatted.rating.count).toBe(12);
        });

        it('should append extra fields such as wishlist boolean when provided', () => {
            const rawItem = { _id: 'item_wish', title: 'Ski Resort' };
            const formatted = formatPackageItem(rawItem, {}, null, { wishlist: true });
            expect(formatted.wishlist).toBe(true);
        });
    });
});

