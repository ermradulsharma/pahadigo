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
 * Enterprise-grade request metadata extractor.
 * Extracts IP, User-Agent, Device Details, Bot Detection, Client Hints, Geo-Location (City, Region, Country, Lat, Long, Postal, ASN),
 * TLS/SSL Protocol & Cipher, HTTP Version, CDN Ray ID & Datacenter, Threat & Bot Scores, Network Latency (RTT, Downlink, ECT),
 * Protocol, Host, Port, Localization (Accept-Language, Preferred Language, Timezone, Device Locale),
 * Mobile App Client Info (App Version, Build Number, Platform, Device ID, Carrier, Bundle ID, SDK Version, App State),
 * UI & Hardware State (Battery Level, Charging, Theme/Color Scheme, Orientation, Reduced Motion),
 * Security Context (Auth Header Present, Auth Type, CSRF, Signature), Connection Metrics (SaveData, Encoding), and Timestamps.
 * 
 * @param {Object} req - Incoming HTTP request object
 * @returns {Object} Full structured request metadata object
 */
export const getRequestMetadata = (req) => {
    const now = new Date();
    const serverTimeMs = now.getTime();

    const getHeader = (name) => {
        if (!req || !req.headers) return null;
        if (typeof req.headers.get === 'function') return req.headers.get(name);
        return req.headers[name] || req.headers[name.toLowerCase()];
    };

    const safeDecode = (str) => {
        if (!str) return '';
        try { return decodeURIComponent(str); } catch { return str; }
    };

    // 1. IP & Network Resolution
    const rawIp =
        getHeader('cf-connecting-ip') ||
        getHeader('true-client-ip') ||
        getHeader('x-client-ip') ||
        getHeader('x-forwarded-for') ||
        getHeader('x-real-ip') ||
        req?.ip ||
        req?.socket?.remoteAddress ||
        req?.connection?.remoteAddress ||
        '127.0.0.1';

    let clientIp = String(rawIp).split(',')[0].trim();
    if (clientIp.startsWith('::ffff:')) clientIp = clientIp.substring(7);
    if (clientIp === '::1') clientIp = '127.0.0.1';

    const protocol = getHeader('x-forwarded-proto') || (req?.socket?.encrypted ? 'https' : (req ? 'http' : 'https'));
    const host = getHeader('x-forwarded-host') || getHeader('host') || 'localhost';
    const port = getHeader('x-forwarded-port') || (protocol === 'https' ? '443' : '80');
    const httpVersion = req?.httpVersion || getHeader('x-http-version') || '1.1';

    // 2. TLS / SSL & CDN Edge Context
    const cfRay = getHeader('cf-ray') || null;
    const datacenter = cfRay && cfRay.includes('-') ? cfRay.split('-').pop() : (getHeader('x-datacenter') || (req ? 'UNKNOWN' : 'LOCAL'));
    const tlsVersion = getHeader('x-ssl-protocol') || getHeader('x-forwarded-tls-version') || (req?.socket?.encrypted ? 'TLSv1.3' : (req ? null : 'TLSv1.3'));
    const tlsCipher = getHeader('cf-tls-cipher') || getHeader('x-ssl-cipher') || null;
    const threatScore = parseInt(getHeader('cf-threat-score') || '0', 10);
    const botScore = parseInt(getHeader('cf-bot-score') || '100', 10);

    // 3. Client Hints (sec-ch-ua headers) & Theme Preferences
    const secChUaMobile = getHeader('sec-ch-ua-mobile') === '?1';
    const secChUaPlatform = safeDecode(getHeader('sec-ch-ua-platform')).replace(/"/g, '');
    const secChUaModel = safeDecode(getHeader('sec-ch-ua-model')).replace(/"/g, '');
    const secChUaArch = safeDecode(getHeader('sec-ch-ua-arch')).replace(/"/g, '');
    const secChUaBitness = safeDecode(getHeader('sec-ch-ua-bitness')).replace(/"/g, '');
    const prefersColorScheme = safeDecode(getHeader('sec-ch-prefers-color-scheme') || getHeader('x-color-scheme') || 'light').replace(/"/g, '');
    const prefersReducedMotion = getHeader('sec-ch-prefers-reduced-motion') === 'reduce';

    // 4. Device Parsing & Bot Detection
    const customDevice = getHeader('x-device-name') || getHeader('x-device-model') || getHeader('x-client-device') || secChUaModel || '';
    const rawAgent = getHeader('user-agent') || req?.userAgent || (req ? 'unknown' : 'system');
    const userAgent = String(rawAgent).trim();
    const device = parseUserAgent(userAgent, customDevice);
    const isBot = req ? (/bot|crawler|spider|googlebot|bingbot|slurp|facebookexternalhit|whatsapp|postman/i.test(userAgent) || botScore < 30) : false;

    // 5. Geo-Location & ISP (Cloudflare, Vercel, GCP, Nginx)
    const city = safeDecode(getHeader('cf-ipcity') || getHeader('x-vercel-ip-city') || getHeader('x-appengine-city') || '');
    const region = safeDecode(getHeader('cf-region') || getHeader('x-vercel-ip-country-region') || getHeader('x-appengine-region') || '');
    const country = safeDecode(getHeader('cf-ipcountry') || getHeader('x-vercel-ip-country') || getHeader('x-appengine-country') || '');
    const latitude = getHeader('cf-iplatitude') || getHeader('x-vercel-ip-latitude') || null;
    const longitude = getHeader('cf-iplongitude') || getHeader('x-vercel-ip-longitude') || null;
    const postalCode = getHeader('cf-postal-code') || getHeader('x-vercel-ip-postal-code') || null;
    const asn = getHeader('cf-connecting-asn') || getHeader('x-asn') || null;

    const validGeoParts = [city, region, country].filter(p => p && p.trim().length > 0);
    const locationSummary = validGeoParts.length > 0 ? validGeoParts.join(', ') : (req ? 'Unknown Location' : 'Local System');

    // 6. Localization & Timezone
    const acceptLanguage = getHeader('accept-language') || 'en-US';
    const preferredLanguage = acceptLanguage.split(',')[0].split(';')[0].trim() || 'en';
    const timezone = getHeader('x-timezone') || getHeader('x-user-timezone') || 'Asia/Kolkata';
    const deviceLocale = getHeader('x-device-locale') || preferredLanguage || 'en_IN';

    // 7. Mobile App Client Metadata, Carrier & SDK State
    const appVersion = getHeader('x-app-version') || getHeader('x-client-version') || null;
    const buildNumber = getHeader('x-app-build') || getHeader('x-build-number') || null;
    const platform = getHeader('x-platform') || (secChUaPlatform || device.os || 'web').toLowerCase();
    const deviceId = getHeader('x-device-id') || getHeader('x-installation-id') || getHeader('x-unique-id') || null;
    const carrier = getHeader('x-carrier-name') || getHeader('x-network-operator') || null;
    const bundleId = getHeader('x-app-bundle-id') || getHeader('x-bundle-id') || null;
    const sdkVersion = getHeader('x-sdk-version') || null;
    const appState = getHeader('x-app-state') || 'active';
    const resolution = getHeader('x-screen-resolution') || null;

    // 8. Hardware & UI State
    const batteryLevel = getHeader('x-battery-level') || null;
    const isCharging = getHeader('x-is-charging') ? getHeader('x-is-charging') === 'true' : null;
    const orientation = getHeader('x-screen-orientation') || 'portrait';

    // 9. Security Context
    const authHeader = getHeader('authorization') || '';
    const authPresent = Boolean(authHeader);
    const authType = authHeader ? (authHeader.split(' ')[0] || 'Unknown') : null;
    const csrfToken = getHeader('x-csrf-token') || getHeader('x-xsrf-token') || null;
    const requestSignature = getHeader('x-signature') || getHeader('x-request-signature') || null;

    // 10. Network Connection Metrics & Performance (RTT, Downlink, ECT)
    const connectionType = getHeader('x-connection-type') || getHeader('netinfo') || null;
    const saveData = getHeader('save-data') === 'on';
    const acceptEncoding = getHeader('accept-encoding') || null;
    const rtt = getHeader('rtt') ? parseInt(getHeader('rtt'), 10) : null;
    const downlink = getHeader('downlink') ? parseFloat(getHeader('downlink')) : null;
    const ect = getHeader('ect') || null;

    // 11. Navigation Context & Client Timestamps
    const referer = getHeader('referer') || null;
    const origin = getHeader('origin') || null;
    const clientTimestamp = getHeader('x-client-timestamp') || getHeader('x-request-timestamp') || null;

    return {
        timestamp: now.toISOString(),
        serverTimeMs,
        clientTimestamp,
        ipAddress: clientIp || '127.0.0.1',
        realIp: clientIp || '127.0.0.1',
        userAgent: userAgent || 'unknown',
        protocol,
        host,
        port,
        httpVersion,
        isBot,
        device,
        location: {
            city: city,
            region: region,
            country: country,
            latitude,
            longitude,
            postalCode,
            asn,
            datacenter,
            summary: locationSummary
        },
        cdn: {
            rayId: cfRay,
            datacenter,
            threatScore,
            botScore
        },
        tls: {
            version: tlsVersion,
            cipher: tlsCipher
        },
        localization: {
            acceptLanguage,
            preferredLanguage,
            timezone,
            deviceLocale
        },
        appInfo: {
            appVersion,
            buildNumber,
            platform,
            deviceId,
            carrier,
            bundleId,
            sdkVersion,
            appState,
            resolution
        },
        hardwareState: {
            batteryLevel,
            isCharging,
            colorScheme: prefersColorScheme,
            orientation,
            reducedMotion: prefersReducedMotion
        },
        clientHints: {
            mobile: secChUaMobile,
            platform: secChUaPlatform || device.os,
            model: secChUaModel || device.deviceName,
            architecture: secChUaArch || null,
            bitness: secChUaBitness || null
        },
        security: {
            authPresent,
            authType,
            csrfToken,
            requestSignature
        },
        network: {
            connectionType,
            saveData,
            acceptEncoding,
            rtt,
            downlink,
            ect
        },
        navigation: {
            referer,
            origin
        }
    };
};

export default { getRequestMetadata, parseUserAgent };