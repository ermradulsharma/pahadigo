/**
 * Router utility for grouping routes with common prefixes and middleware
 */
class Router {
    constructor() {
        this.routes = [];
    }

    /**
     * Create a group of routes
     * @param {Object} options - { prefix, middleware }
     * @param {Array|Function} routes - Child routes or a function that returns child routes
     * @returns {Array} - Flattened routes
     */
    static group(options, children) {
        const { prefix = '', middleware = [] } = options;
        let childRoutes = typeof children === 'function' ? children() : children;

        // Ensure childRoutes is an array
        if (!Array.isArray(childRoutes)) {
            childRoutes = [childRoutes];
        }

        return childRoutes.map(route => {
            // Handle nested groups (which are already arrays)
            if (Array.isArray(route)) {
                return Router.group(options, route);
            }

            const newPath = (prefix + (route.path || '')).replace(/\/+/g, '/') || '/';
            const newMiddleware = [...middleware, ...(route.middleware || [])];

            return {
                ...route,
                path: newPath,
                middleware: newMiddleware.length > 0 ? [...new Set(newMiddleware)] : undefined
            };
        }).flat(Infinity);
    }
}

export default Router;
