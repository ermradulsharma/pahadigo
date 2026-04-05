import { sanitizeNoSQL, sanitizeHTML, redactSensitiveData } from '../../../src/core/Helpers/security.js';

describe('SecurityHelper Test Suite', () => {
    describe('sanitizeNoSQL', () => {
        it('should remove keys starting with $', () => {
            const input = { username: 'test', $where: '1=1', nested: { $gt: 5, value: 10 } };
            const sanitized = sanitizeNoSQL(input);
            expect(sanitized.$where).toBeUndefined();
            expect(sanitized.nested.$gt).toBeUndefined();
            expect(sanitized.username).toBe('test');
            expect(sanitized.nested.value).toBe(10);
        });

        it('should handle arrays', () => {
            const input = [{ $ignore: true, val: 1 }, { val: 2 }];
            const sanitized = sanitizeNoSQL(input);
            expect(sanitized[0].$ignore).toBeUndefined();
            expect(sanitized[0].val).toBe(1);
        });
    });

    describe('sanitizeHTML', () => {
        it('should escape dangerous characters', () => {
            const html = '<script>alert("xss")</script>';
            const sanitized = sanitizeHTML(html);
            expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });
    });

    describe('redactSensitiveData', () => {
        it('should replace sensitive keys with redaction placeholder', () => {
            const data = { 
                email: 'test@test.com', 
                password: 'plainPassword', 
                card: { token: '123-456', cvv: '123' } 
            };
            const redacted = redactSensitiveData(data);
            expect(redacted.email).toBe('test@test.com');
            expect(redacted.password).toBe('***REDACTED***');
            expect(redacted.card.token).toBe('***REDACTED***');
            expect(redacted.card.cvv).toBe('***REDACTED***');
        });
    });
});
