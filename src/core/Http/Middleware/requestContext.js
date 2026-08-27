import { getRequestMetadata } from '@/core/Helpers/requestUtils.js';

/**
 * Request Context Middleware
 * Extracts comprehensive client request context (IP, Protocol, Host, Device, Geo-Location, TLS/SSL, CDN Edge, Localization, App Info, Hardware, Client Hints, Security, Network, Bot Detection, Navigation).
 * 
 * @param {Request|Object} req - Incoming request object
 * @returns {Object} Complete structured request context metadata
 */
const requestContextMiddleware = (req) => {
    const metadata = getRequestMetadata(req);

    if (req && typeof req === 'object' && Object.isExtensible(req)) {
        req.context = metadata;
        req.clientIp = metadata.ipAddress;
        req.realIp = metadata.realIp;
        req.deviceInfo = metadata.device;
        req.locationInfo = metadata.location;
    }

    return {
        ...metadata,
        ip: metadata.ipAddress,
        device: metadata.device.summary,
        rawDevice: metadata.device,
        location: metadata.location.summary,
        rawLocation: metadata.location
    };
};

export default requestContextMiddleware;