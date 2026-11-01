import { NextRequest } from 'next/server';

class MockRequest {
    constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Headers(options.headers || {});
        this._json = options.jsonBody || options.body || {};
        this.cookies = {
            get: (name) => {
                const cookieHeader = this.headers.get('cookie') || '';
                const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
                return match ? { value: decodeURIComponent(match[2]) } : null;
            }
        };
    }

    async json() {
        return this._json;
    }
}

/**
 * Directly invokes the App Router handler with synthesized request
 * avoiding any port binding or network virtualization!
 */
export async function invokeApi(handler, options = {}) {
    const slugPath = options.path || '';
    const params = options.params || {};

    const req = new MockRequest(`http://localhost/api/${slugPath}`, options);
    const response = await handler(req, { params });
    
    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        // response might be empty or stream
    }

    return {
        status: response.status,
        headers: response.headers,
        data,
        response
    };
}
