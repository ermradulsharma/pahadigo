import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { Writable } from 'stream';
import pretty from 'pino-pretty';

// Do NOT check process.env.NEXT_RUNTIME here.
// Next.js sets NEXT_RUNTIME ('nodejs' | 'edge') in all server contexts,
// which previously caused all local server requests to falsely identify as Vercel.
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.LOG_TO_STDOUT_ONLY === 'true';
const isProduction = process.env.NODE_ENV === 'production';

let logger;

if (isVercel) {
    // In Vercel / Serverless runtime, write directly to stdout (read-only filesystem)
    logger = pino({
        level: process.env.LOG_LEVEL || 'info',
        formatters: {
            level: (label) => ({ level: label.toUpperCase() }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    });
} else {
    // Local / Container environment with local filesystem access
    let cachedDateStr = '';
    let cachedLogFilePath = '';

    const getDailyLogFilePath = () => {
        try {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            const dateStr = `${dd}_${mm}_${yyyy}`;

            if (dateStr === cachedDateStr && cachedLogFilePath) {
                return cachedLogFilePath;
            }

            const logDir = path.resolve(process.cwd(), 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const logFilePath = path.join(logDir, `${dateStr}_pahadigo.log`);
            if (!fs.existsSync(logFilePath)) {
                fs.writeFileSync(logFilePath, '', { flag: 'a' });
            }

            cachedDateStr = dateStr;
            cachedLogFilePath = logFilePath;
            return logFilePath;
        } catch {
            return null;
        }
    };

    // Pre-initialize current day's log file so it exists immediately
    getDailyLogFilePath();

    const streams = [];

    // 1. Console stream (pretty in development, raw stdout in production)
    if (!isProduction) {
        try {
            const buildPretty = typeof pretty === 'function' ? pretty : pretty?.default;
            if (typeof buildPretty === 'function') {
                streams.push({
                    stream: buildPretty({
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                    }),
                });
            } else {
                streams.push({ stream: process.stdout });
            }
        } catch {
            streams.push({ stream: process.stdout });
        }
    } else {
        streams.push({ stream: process.stdout });
    }

    // 2. Daily file stream (synchronous append avoids worker_threads bundler issues in Next.js)
    const fileStream = new Writable({
        write(chunk, encoding, callback) {
            try {
                const filePath = getDailyLogFilePath();
                if (filePath) {
                    fs.appendFileSync(filePath, chunk);
                }
            } catch {
                // Silently handle write errors so logging never crashes the request cycle
            }
            callback();
        },
    });

    streams.push({ stream: fileStream });

    logger = pino(
        {
            level: process.env.LOG_LEVEL || 'info',
            formatters: {
                level: (label) => ({ level: label.toUpperCase() }),
            },
            timestamp: pino.stdTimeFunctions.isoTime,
        },
        pino.multistream(streams)
    );
}

export const getLogger = (requestId) => {
    if (requestId) {
        return logger.child({ requestId });
    }
    return logger;
};

export default logger;

