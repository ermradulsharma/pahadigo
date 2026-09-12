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
        const { prefix = '', middleware = [], roles = [] } = options;
        let childRoutes = typeof children === 'function' ? children() : children;
        if (!Array.isArray(childRoutes)) childRoutes = [childRoutes];
        return childRoutes.map(route => {
            if (Array.isArray(route)) return Router.group(options, route);
            const newPath = (prefix + (route.path || '')).replace(/\/+/g, '/') || '/';
            const newMiddleware = [...middleware, ...(route.middleware || [])];
            const newRoles = [...roles, ...(route.roles || [])];
            const finalRoute = {
                ...route,
                path: newPath,
                middleware: newMiddleware.length > 0 ? [...new Set(newMiddleware)] : undefined,
                roles: newRoles.length > 0 ? [...new Set(newRoles)] : undefined
            };
            if (Array.isArray(finalRoute.method)) return finalRoute.method.map(m => ({ ...finalRoute, method: m }));
            return finalRoute;
        }).flat(Infinity);
    }
}

export default Router;
