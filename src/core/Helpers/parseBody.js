async function parseBody(req) {
    // 0. Use pre-parsed body from route.js middleware
    if (req.jsonBody) return req.jsonBody;
    if (req.formDataBody) {
        const body = {};
        for (const [key, value] of req.formDataBody.entries()) {
            body[key] = value;
        }
        return body;
    }

    const contentType = req.headers.get('content-type') || '';

    // 1. Handle JSON
    if (contentType.includes('application/json')) {
        try {
            return await req.json();
        } catch (e) {
            return {};
        }
    }

    // 2. Handle FormData
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        try {
            const formData = await req.formData();
            const body = {};
            for (const [key, value] of formData.entries()) {
                body[key] = value;
            }
            return body;
        } catch (e) {
            return {};
        }
    }

    // 3. Fallback or Plain Text
    return {};
}

export { parseBody };
