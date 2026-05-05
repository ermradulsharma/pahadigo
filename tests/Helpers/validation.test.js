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
    });
});
