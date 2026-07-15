import { schemas } from '@/core/Helpers/validation.js';

describe('Integration: Validation Schemas', () => {
    describe('Auth Schemas (Negative Paths)', () => {
        it('should reject malformed email', () => {
            const result = schemas.passwordLogin.safeParse({ email: 'not-an-email', password: 'password123' });
            // Should fail because identifier is not a valid email or phone
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toMatch(/valid email/);
        });

        it('should reject missing password on login', () => {
            const result = schemas.passwordLogin.safeParse({ email: 'test@example.com' });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toMatch(/Required|expected string/i);
        });
    });

    describe('Booking Schemas (Negative Paths)', () => {
        it('should reject booking with invalid date format', () => {
            const result = schemas.booking.safeParse({
                startDate: 'not-a-date',
                endDate: '2025-01-05'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Profile Schemas (Negative Paths)', () => {
        it('should reject invalid phone number', () => {
            const result = schemas.profileUpdate.safeParse({
                phone: 'abc' // Invalid
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toMatch(/Invalid phone number/);
        });
    });
});
