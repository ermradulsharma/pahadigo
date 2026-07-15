/**
 * Simulates a Next.js Edge Request object for testing the API Dispatcher.
 */
class MockRequest {
    constructor(url, options = {}) {
        this.url = url;
        this.method = (options.method || 'GET').toUpperCase();
        
        // Mock headers
        const headerMap = new Map();
        if (options.headers) {
            Object.keys(options.headers).forEach(k => headerMap.set(k.toLowerCase(), options.headers[k]));
        }
        
        // Default content type if body is provided
        if (options.body && !headerMap.has('content-type')) {
            if (typeof options.body === 'object') {
                headerMap.set('content-type', 'application/json');
            } else {
                headerMap.set('content-type', 'text/plain');
            }
        }
        
        this.headers = {
            get: (key) => headerMap.get(key.toLowerCase()) || null,
            set: (key, value) => headerMap.set(key.toLowerCase(), value)
        };
        
        this._body = options.body;
    }
    
    async text() {
        if (typeof this._body === 'object') return JSON.stringify(this._body);
        return String(this._body || '');
    }
    
    async json() {
        if (typeof this._body === 'string') return JSON.parse(this._body);
        return this._body || {};
    }
    
    async formData() {
        // Simple mock for formData
        const fd = new Map();
        if (typeof this._body === 'object') {
            for (const [k, v] of Object.entries(this._body)) {
                fd.set(k, v);
            }
        }
        fd.entries = function* () {
            for (const [k, v] of fd.entries()) {
                yield [k, v];
            }
        };
        return fd;
    }
}

/**
 * Helper to test the API dispatcher.
 * @param {Function} handler - The GET/POST/etc function from route.js
 * @param {string} slugPath - e.g., 'public/packages'
 * @param {Object} options - { method, body, headers }
 */
async function invokeApi(handler, slugPath, options = {}) {
    const slug = slugPath.split('/').filter(Boolean);
    const req = new MockRequest(`http://localhost/api/${slugPath}`, options);
    
    // In Next.js App Router, params is often a Promise yielding { slug }
    const response = await handler(req, { params: Promise.resolve({ slug }) });
    
    let data = null;
    if (response) {
       data = await response.json().catch(() => null);
    }
    
    return {
        status: response ? response.status : 500,
        headers: response ? response.headers : null,
        data,
        response
    };
}

export { MockRequest, invokeApi };
