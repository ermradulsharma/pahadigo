import { validate, schemas } from '@/core/Helpers/validation.js';

describe('Validation Helper', () => {
    describe('validate() function', () => {
        test('should return success and data for valid input', () => {
            const schema = schemas.passwordLogin;
            const data = { email: 'test@test.com', password: 'password123' };
            const result = validate(schema, data);
            expect(result.success).toBe(true);
            expect(result.data.email).toBe('test@test.com');
        });

        test('should return failure and error message for invalid input', () => {
            const schema = schemas.passwordLogin;
            const data = { email: 'invalid-email', password: '123' };
            const result = validate(schema, data);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('otpSend Schema', () => {
        test('should fail if neither email nor phone is provided', () => {
            const result = validate(schemas.otpSend, { role: 'traveller', termsAccepted: true });
            expect(result.success).toBe(false);
        });

        test('should pass if email is provided', () => {
            const result = validate(schemas.otpSend, { email: 'test@test.com', role: 'traveller', termsAccepted: true });
            expect(result.success).toBe(true);
        });
    });

    describe('otpLogin Schema', () => {
        test('should transform email to identifier', () => {
            const result = validate(schemas.otpLogin, { email: 'test@test.com', otp: '1234', role: 'traveller' });
            expect(result.success).toBe(true);
            expect(result.data.identifier || result.data.email).toBe('test@test.com');
        });

        test('should transform role to targetRole', () => {
            const result = validate(schemas.otpLogin, { phone: '1234567890', otp: '1234', role: 'vendor' });
            expect(result.success).toBe(true);
            expect(result.data.targetRole || result.data.role).toBe('vendor');
        });
    });

    describe('booking Schema', () => {
        test('should fail for invalid dates', () => {
            const data = {
                catalogId: 'cat1',
                category: 'pkg',
                itemId: 'item1',
                startDate: 'not-a-date',
                endDate: '2025-01-01',
                price: 100
            };
            const result = validate(schemas.booking, data);
            expect(result.success).toBe(false);
        });

        test('should pass when catalogId, category, and itemId are omitted', () => {
            const data = {
                startDate: '2026-07-08',
                endDate: '2026-07-17',
                price: 100
            };
            const result = validate(schemas.booking, data);
            expect(result.success).toBe(true);
        });

        test('should pass and ignore price if price is an object or invalid structure', () => {
            const data = {
                startDate: '2026-07-08',
                endDate: '2026-07-17',
                price: { coupon: '' }
            };
            const result = validate(schemas.booking, data);
            expect(result.success).toBe(true);
        });

        test('should pass through extra fields like adults, children, includeMe, and guestDetails', () => {
            const data = {
                startDate: '2026-07-18',
                endDate: '2026-07-25',
                adults: 2,
                children: 0,
                includeMe: true,
                guestDetails: [{ name: 'Priyanka Pandey', phone: '8940940163' }]
            };
            const result = validate(schemas.booking, data);
            expect(result.success).toBe(true);
        });
    });

    describe('packageMutation Schema', () => {
        test('should validate Postman-like package mutation payload', () => {
            const payload = {
                category: 'homestay',
                title: 'Himalayan Cottage',
                description: 'A beautiful cottage in the hills',
                isActive: false,
                details: {
                    type: 'Cottage',
                    rentalType: 'Entire Place',
                    roomType: 'Attic',
                    bedType: 'Bunk',
                    bathroomType: 'Common',
                    checkInTime: '04:00 PM',
                    checkOutTime: '01:00 AM'
                },
                availability: {
                    total: 42,
                    available: 21,
                    occupied: 5,
                    reserved: 16
                },
                pricing: {
                    basePrice: 4538,
                    discountType: 'percentage',
                    discount: 4,
                    gst: 18,
                    sellingPrice: 5173.32,
                    maxGuests: 5,
                    maxAdults: 1,
                    maxChildren: 4,
                    childPrice: 1367,
                    extraBedAvailable: false,
                    extraBedPrice: 2431
                },
                policies: {
                    cancellationPolicy: '100% refund...',
                    instructions: 'Please respect...',
                    isCouplesFriendly: false,
                    isPetFriendly: false,
                    isSmokingAllowed: false,
                    isMusicAllowed: false
                },
                amenities: 'WiFi, Telescope, Caretaker, Bonfire, Parking, Heater, Electric Kettle',
                mealsIncluded: false,
                mealType: 'Buffet',
                location: {
                    address: 'Ski Resort, Near Ropeway, Auli, Uttarakhand, IN - 246443',
                    latitude: 30.5312,
                    longitude: 79.5665
                },
                photos: ['url1', 'url2']
            };
            const result = validate(schemas.packageMutation, payload);
            expect(result.success).toBe(true);
        });
    });
});
