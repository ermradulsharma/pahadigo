export function apiHandler(handler) {
    return async (req, params) => {
        try {
            return await handler(req, params);
        } catch (err) {
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: err.message || 'Something went wrong',
                stack: process.env.NODE_ENV === 'production' ? null : err.stack
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
}
