import { validate, schemas } from '../../../src/core/Helpers/validation.js';

describe('Validation Helper', () => {
    
    describe('passwordLogin validation', () => {
        it('should pass for valid email and password', () => {
            const data = { email: 'test@example.com', password: 'securepassword123' };
            const result = validate(schemas.passwordLogin, data);
            expect(result.success).toBe(true);
            expect(result.data.email).toBe(data.email);
        });

        it('should fail for invalid email', () => {
            const data = { email: 'invalid-email', password: 'password' };
            const result = validate(schemas.passwordLogin, data);
            expect(result.success).toBe(false);
            expect(result.error).toContain('email');
        });

        it('should fail for short password', () => {
            const data = { email: 'test@example.com', password: '123' };
            const result = validate(schemas.passwordLogin, data);
            expect(result.success).toBe(false);
            expect(result.error).toContain('password');
        });
    });

    describe('otpSend validation', () => {
        it('should pass for either email or phone', () => {
            expect(validate(schemas.otpSend, { email: 'e@e.com' }).success).toBe(true);
            expect(validate(schemas.otpSend, { phone: '1234567890' }).success).toBe(true);
        });

        it('should fail if both are missing', () => {
            const result = validate(schemas.otpSend, { role: 'traveller' });
            expect(result.success).toBe(false);
        });
    });

    describe('otpLogin validation', () => {
        it('should transform result with identifier', () => {
             const result = validate(schemas.otpLogin, { email: 'e@e.com', otp: '1234' });
             expect(result.success).toBe(true);
             expect(result.data.identifier).toBe('e@e.com');
        });

        it('should map role to targetRole during transformation', () => {
            const result = validate(schemas.otpLogin, { identifier: 'user', otp: '1234', role: 'vendor' });
            expect(result.success).toBe(true);
            expect(result.data.targetRole).toBe('vendor');
        });
    });

    describe('booking validation', () => {
        it('should pass for valid dates', () => {
            const data = { 
                catalogId: 'cat1', 
                category: 'acc', 
                itemId: 'i1', 
                travelDate: '2025-01-01' 
            };
            expect(validate(schemas.booking, data).success).toBe(true);
        });

        it('should fail for invalid dates', () => {
            const data = { 
                catalogId: 'cat1', 
                category: 'acc', 
                itemId: 'i1', 
                travelDate: 'not-a-date' 
            };
            expect(validate(schemas.booking, data).success).toBe(false);
        });
    });
});
