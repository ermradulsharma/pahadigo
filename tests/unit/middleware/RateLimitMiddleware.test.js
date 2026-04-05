import { rateLimit } from '../../../src/core/Http/Middleware/rateLimit.js';
import RateLimit from '../../../src/core/Models/RateLimit.js';
import { cleanDatabase } from '../../helpers/testUtils.js';

describe('RateLimit Middleware Test Suite', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('should allow requests within limit', async () => {
        const limiter = rateLimit({ limit: 2, windowMs: 1000 });
        const req = { 
            ip: '127.0.0.1', 
            url: 'http://localhost/test',
            headers: { get: () => null }
        };

        const res1 = await limiter(req);
        expect(res1).toBeNull();

        const res2 = await limiter(req);
        expect(res2).toBeNull();
    });

    it('should block requests exceeding limit', async () => {
         const limiter = rateLimit({ limit: 1, windowMs: 1000 });
         const req = { 
            ip: '127.0.0.2', 
            url: 'http://localhost/test',
            headers: { get: () => null }
        };

        await limiter(req);
        const res = await limiter(req);
        
        expect(res).toBeDefined();
        expect(res.status).toBe(429);
        const body = await res.json();
        expect(body.success).toBe(false);
    });
});
