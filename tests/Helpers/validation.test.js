import { validate, schemas } from '@/core/Helpers/validation.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

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
            expect(result.error).toContain('email');
            expect(result.error).toContain('password');
        });
    });

    describe('otpSend Schema', () => {
        test('should fail if neither email nor phone is provided', () => {
            const result = validate(schemas.otpSend, { role: 'traveller' });
            expect(result.success).toBe(false);
            expect(result.error).toContain(RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED);
        });

        test('should pass if email is provided', () => {
            const result = validate(schemas.otpSend, { email: 'test@test.com' });
            expect(result.success).toBe(true);
        });
    });

    describe('otpLogin Schema', () => {
        test('should transform email to identifier', () => {
            const result = validate(schemas.otpLogin, { email: 'test@test.com', otp: '1234' });
            expect(result.success).toBe(true);
            expect(result.data.identifier).toBe('test@test.com');
        });

        test('should transform role to targetRole', () => {
            const result = validate(schemas.otpLogin, { phone: '1234567890', otp: '1234', role: 'vendor' });
            expect(result.success).toBe(true);
            expect(result.data.targetRole).toBe('vendor');
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
            expect(result.error).toContain(RESPONSE_MESSAGES.VALIDATION.INVALID_DATE);
        });

        test('should pass when catalogId, category, and itemId are omitted', () => {
            const data = {
                startDate: '2026-07-08',
                endDate: '2026-07-17',
                price: 100
            };
            const result = validate(schemas.booking, data);
            expect(result.success).toBe(true);
            expect(result.data.catalogId).toBeUndefined();
            expect(result.data.category).toBeUndefined();
            expect(result.data.itemId).toBeUndefined();
        });

        test('should pass and ignore price if price is an object or invalid structure', () => {
            const data = {
                startDate: '2026-07-08',
                endDate: '2026-07-17',
                price: { coupon: '' }
            };
            const result = validate(schemas.booking, data);
            expect(result.success).toBe(true);
            expect(result.data.price).toBeUndefined();
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
            expect(result.data.adults).toBe(2);
            expect(result.data.children).toBe(0);
            expect(result.data.includeMe).toBe(true);
            expect(result.data.guestDetails).toHaveLength(1);
            expect(result.data.guestDetails[0].name).toBe('Priyanka Pandey');
        });
    });
});
