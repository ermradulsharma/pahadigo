import { jest } from '@jest/globals';
import { withRetry } from '@/core/Helpers/resilience.js';

// We mock an external API
const mockExternalGateway = jest.fn();

describe('Integration: Notification Resilience', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should retry a failing gateway request and eventually succeed', async () => {
        // Fail 2 times, succeed on 3rd
        mockExternalGateway
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockRejectedValueOnce(new Error('502 Bad Gateway'))
            .mockResolvedValueOnce({ success: true, messageId: '123' });

        const result = await withRetry(() => mockExternalGateway(), { maxRetries: 3, baseDelayMs: 10 });
        
        expect(mockExternalGateway).toHaveBeenCalledTimes(3);
        expect(result.success).toBe(true);
        expect(result.messageId).toBe('123');
    });

    it('should throw error if all retries fail', async () => {
        mockExternalGateway.mockRejectedValue(new Error('Gateway Timeout'));

        await expect(withRetry(() => mockExternalGateway(), { maxRetries: 2, baseDelayMs: 10 }))
            .rejects.toThrow('Gateway Timeout');
        
        expect(mockExternalGateway).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
});
