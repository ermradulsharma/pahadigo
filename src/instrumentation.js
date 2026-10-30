/**
 * Next.js Server Lifecycle Instrumentation
 * Runs once when the Node.js server starts.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            const http = await import('node:http');
            const origAdd = http.IncomingMessage.prototype._addHeaderLines;
            if (typeof origAdd === 'function') {
                http.IncomingMessage.prototype._addHeaderLines = function (...args) {
                    origAdd.apply(this, args);
                    // Ensure req.headers has Object.prototype in prototype chain so that
                    // any internal or external call to .hasOwnProperty() never throws TypeError
                    if (this.headers && typeof this.headers.hasOwnProperty !== 'function') {
                        Object.setPrototypeOf(this.headers, Object.prototype);
                    }
                };
            }
        } catch (e) {
            // Silently fallback if http prototype patching is restricted
        }
    }
}

