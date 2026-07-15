/**
 * Resilience utilities for external gateway integrations.
 */

/**
 * Wraps an asynchronous operation with exponential backoff retries.
 *
 * @param {Function} operation - The async function to execute.
 * @param {Object} options - Configuration for retries.
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [options.baseDelayMs=500] - Base delay in milliseconds before the first retry.
 * @param {Function} [options.shouldRetry] - Optional function to determine if an error should trigger a retry.
 * @returns {Promise<any>}
 */
export const withRetry = async (operation, options = {}) => {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelayMs = options.baseDelayMs ?? 500;
    const shouldRetry = options.shouldRetry ?? (() => true);

    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            return await operation();
        } catch (error) {
            attempt++;
            
            if (attempt > maxRetries || !shouldRetry(error)) {
                throw error;
            }

            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            
            // Add slight jitter (0-20%) to prevent thundering herd
            const jitter = delay * (Math.random() * 0.2);
            
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`[Resilience] Attempt ${attempt} failed. Retrying in ${Math.round(delay + jitter)}ms... Error: ${error.message}`);
            }
            
            await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        }
    }
};
