/**
 * Next.js Server Lifecycle Instrumentation
 * Runs once when the Node.js server starts.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            const http = await import('node:http');

            // 1. KeepAlive & Headers Timeout fix for reverse proxies (Nginx / Cloudflare)
            const origListen = http.Server.prototype.listen;
            if (typeof origListen === 'function') {
                http.Server.prototype.listen = function (...args) {
                    this.keepAliveTimeout = 65000; // 65s (strictly > Nginx keepalive_timeout 60s)
                    this.headersTimeout = 66000;   // 66s (must be > keepAliveTimeout)
                    this.requestTimeout = 120000;  // 120s (uploads and heavy operations)
                    return origListen.apply(this, args);
                };
            }

            // 2. IncomingMessage headers prototype fix
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

