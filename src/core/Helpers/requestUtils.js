/**
 * Parses User-Agent header string and custom device headers to extract exact OS, Browser, Device Type, and Device Name.
 * Zero-dependency, lightweight, high-performance implementation.
 * 
 * @param {string} uaString - Raw User-Agent string
 * @param {string} customDevice - Optional explicit device name passed from Mobile App headers (e.g., 'iPhone 15 Pro', 'Samsung S23')
 * @returns {Object} { os, browser, deviceType, deviceName, summary }
 */
export const parseUserAgent = (uaString, customDevice = '') => {
    if (customDevice && typeof customDevice === 'string' && customDevice.trim().length > 0) {
        const cleanName = customDevice.trim();
        return {
            os: /iPhone|iPad|iOS/i.test(cleanName) ? 'iOS' : (/Android/i.test(cleanName) ? 'Android' : 'Mobile/Desktop'),
            browser: /PahadiGo/i.test(uaString) ? 'PahadiGo App' : 'Mobile App',
            deviceType: /iPad|Tablet/i.test(cleanName) ? 'Tablet' : 'Mobile',
            deviceName: cleanName,
            summary: cleanName
        };
    }

    if (!uaString || uaString === 'unknown' || typeof uaString !== 'string') {
        return {
            os: 'Unknown OS',
            browser: 'Unknown Browser',
            deviceType: 'Desktop',
            deviceName: 'Unknown Device',
            summary: 'Unknown Device'
        };
    }

    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    let deviceType = 'Desktop';
    let deviceName = 'Desktop PC';

    // Detailed Mobile Device & Model Extraction from User-Agent
    const modelMatch = uaString.match(/\(([^)]+)\)/);
    const systemInfo = modelMatch ? modelMatch[1] : '';

    if (/iPhone/i.test(uaString)) {
        os = 'iOS';
        deviceType = 'Mobile';
        deviceName = 'iPhone';
    } else if (/iPad/i.test(uaString)) {
        os = 'iOS';
        deviceType = 'Tablet';
        deviceName = 'iPad';
    } else if (/Android/i.test(uaString)) {
        os = 'Android';
        deviceType = /Mobile/i.test(uaString) ? 'Mobile' : 'Tablet';

        // Extract specific Android phone brands & models if present in User-Agent string
        if (/Pixel/i.test(systemInfo)) {
            const m = systemInfo.match(/Pixel\s?[\w\s]+/i);
            deviceName = m ? m[0].trim() : 'Google Pixel';
        } else if (/SM-[A-Z0-9]+/i.test(systemInfo) || /Samsung/i.test(systemInfo)) {
            deviceName = 'Samsung Galaxy Device';
        } else if (/OnePlus/i.test(systemInfo)) {
            deviceName = 'OnePlus Device';
        } else if (/Redmi|Mi\s|Xiaomi/i.test(systemInfo)) {
            deviceName = 'Xiaomi / Redmi Device';
        } else if (/Vivo/i.test(systemInfo)) {
            deviceName = 'Vivo Phone';
        } else if (/OPPO/i.test(systemInfo)) {
            deviceName = 'OPPO Phone';
        } else if (/Realme/i.test(systemInfo)) {
            deviceName = 'Realme Phone';
        } else {
            deviceName = 'Android Mobile';
        }
    } else if (/Windows/i.test(uaString)) {
        os = 'Windows';
        deviceType = 'Desktop';
        deviceName = 'Windows PC';
    } else if (/Macintosh|Mac OS X/i.test(uaString)) {
        os = 'macOS';
        deviceType = 'Desktop';
        deviceName = 'MacBook / Mac';
    } else if (/Linux/i.test(uaString)) {
        os = 'Linux';
        deviceType = 'Desktop';
        deviceName = 'Linux PC';
    }

    // Browser & App Detection
    if (/PahadiGo/i.test(uaString)) {
        browser = 'PahadiGo App';
    } else if (/PostmanRuntime/i.test(uaString)) {
        browser = 'Postman';
    } else if (/Edg/i.test(uaString)) {
        browser = 'Microsoft Edge';
    } else if (/Chrome|CriOS/i.test(uaString) && !/Edg|OPR/i.test(uaString)) {
        browser = 'Google Chrome';
    } else if (/Safari/i.test(uaString) && !/Chrome|CriOS/i.test(uaString)) {
        browser = 'Apple Safari';
    } else if (/Firefox|FxiOS/i.test(uaString)) {
        browser = 'Mozilla Firefox';
    }

    const summary = `${deviceName} (${os}) via ${browser}`;

    return { os, browser, deviceType, deviceName, summary };
};

/**
 * Enterprise-grade request metadata extractor (IP, User-Agent, Device Info & Geo Location).
 * Supports custom mobile device headers (`x-device-name`, `x-device-model`).
 * 
 * @param {Object} req - Incoming HTTP request object
 * @returns {Object} { ipAddress, realIp, userAgent, device, location }
 */
export const getRequestMetadata = (req) => {
    if (!req) {
        return {
            ipAddress: '127.0.0.1',
            realIp: '127.0.0.1',
            userAgent: 'system',
            device: parseUserAgent('system'),
            location: { city: 'Unknown', country: 'Unknown', summary: 'Local System' }
        };
    }

    const getHeader = (name) => {
        if (!req.headers) return null;
        if (typeof req.headers.get === 'function') return req.headers.get(name);
        return req.headers[name] || req.headers[name.toLowerCase()];
    };

    // IP Resolution with Cloudflare & Reverse Proxy Support
    const rawIp =
        getHeader('cf-connecting-ip') ||
        getHeader('true-client-ip') ||
        getHeader('x-client-ip') ||
        getHeader('x-forwarded-for') ||
        getHeader('x-real-ip') ||
        req.ip ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        '127.0.0.1';

    let clientIp = String(rawIp).split(',')[0].trim();
    if (clientIp.startsWith('::ffff:')) clientIp = clientIp.substring(7);

    // Custom Device Header Support (Passed from Mobile App)
    const customDevice = getHeader('x-device-name') || getHeader('x-device-model') || getHeader('x-client-device') || '';

    // User Agent Resolution & Device Parsing
    const rawAgent = getHeader('user-agent') || req.userAgent || 'unknown';
    const userAgent = String(rawAgent).trim();
    const device = parseUserAgent(userAgent, customDevice);

    // Geo Location Headers Resolution (Cloudflare, Vercel, GCP, Nginx headers)
    const city = getHeader('cf-ipcity') || getHeader('x-vercel-ip-city') || getHeader('x-appengine-city') || '';
    const region = getHeader('cf-region') || getHeader('x-vercel-ip-country-region') || getHeader('x-appengine-region') || '';
    const country = getHeader('cf-ipcountry') || getHeader('x-vercel-ip-country') || getHeader('x-appengine-country') || '';
    
    const validGeoParts = [city, region, country].filter(p => p && p.trim().length > 0);
    const locationSummary = validGeoParts.length > 0 ? validGeoParts.join(', ') : 'Unknown Location';

    return {
        ipAddress: clientIp || '127.0.0.1',
        realIp: clientIp || '127.0.0.1',
        userAgent: userAgent || 'unknown',
        device,
        location: {
            city: city || 'Unknown City',
            region: region || 'Unknown Region',
            country: country || 'Unknown Country',
            summary: locationSummary
        }
    };
};

export default { getRequestMetadata, parseUserAgent };
