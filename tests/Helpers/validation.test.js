import { schemas, validate } from '@/helpers/validation.js';

describe('Industry Standard: Validation Logic', () => {
    describe('[validate]', () => {
        it('[Success] should return success:true for valid data', () => {
            const result = validate(schemas.passwordLogin, {
                email: 'test@test.com',
                password: 'password123'
            });
            expect(result.success).toBe(true);
            expect(result.data.email).toBe('test@test.com');
        });

        it('[Failure] should return success:false and error message for invalid data', () => {
            const result = validate(schemas.passwordLogin, {
                email: 'not-an-email',
                password: 'short'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('email');
            expect(result.error).toContain('password');
        });
    });

    describe('[otpSend Schema]', () => {
        it('[Failure] should fail if neither email nor phone provided', () => {
            const result = validate(schemas.otpSend, { role: 'traveller' });
            expect(result.success).toBe(false);
        });
    });
});
