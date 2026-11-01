class MockRequest {
    constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers || {});
        this._rawBody = typeof options.body === 'string' 
            ? options.body 
            : (options.body ? JSON.stringify(options.body) : '');
        this._json = options.jsonBody || (typeof options.body === 'object' && options.body !== null ? options.body : {});
        if (!options.jsonBody && typeof options.body === 'string') {
            try {
                this._json = JSON.parse(options.body);
            } catch (e) {
                this._json = {};
            }
        }
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

    async text() {
        return this._rawBody;
    }
}

/**
 * Directly invokes the App Router handler with synthesized request
 * avoiding any port binding or network virtualization!
 */
export async function invokeApi(handler, pathOrOptions = {}, maybeOptions = {}) {
    let slugPath = '';
    let options = {};

    if (typeof pathOrOptions === 'string') {
        slugPath = pathOrOptions.replace(/^\/?api\/?/, '').replace(/^\//, '');
        options = maybeOptions || {};
    } else {
        options = pathOrOptions || {};
        slugPath = (options.path || '').replace(/^\/?api\/?/, '').replace(/^\//, '');
    }

    const headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers || {});
    if (!headers.has('content-type') && options.body) {
        headers.set('content-type', 'application/json');
    }

    const req = new MockRequest(`http://localhost/api/${slugPath}`, {
        ...options,
        headers
    });

    const slugArray = slugPath.split('/').filter(Boolean);
    const params = options.params || { slug: slugArray };

    const response = await handler(req, { params: Promise.resolve ? Promise.resolve(params) : params });
    
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
