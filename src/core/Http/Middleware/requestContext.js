import { getRequestMetadata } from '@/core/Helpers/requestUtils.js';

/**
 * Request Context Middleware
 * Extracts client IP, User-Agent, parsed Device Info, and Geo-Location from request headers.
 * 
 * @param {Request} req - Incoming request object
 * @returns {Object} { ip, realIp, device, rawDevice, location }
 */
export const requestContextMiddleware = (req) => {
    if (!req) {
        return {
            ip: '127.0.0.1',
            realIp: '127.0.0.1',
            device: 'System',
            rawDevice: { os: 'System', browser: 'System', deviceName: 'System', summary: 'System' },
            location: 'Local System'
        };
    }

    const { ipAddress, realIp, userAgent, device, location } = getRequestMetadata(req);

    req.clientIp = ipAddress;
    req.realIp = realIp;
    req.userAgent = userAgent;
    req.deviceInfo = device;
    req.locationInfo = location;

    return {
        ip: ipAddress,
        realIp: realIp,
        device: device.summary,
        rawDevice: device,
        location: location.summary
    };
};

export default requestContextMiddleware;
