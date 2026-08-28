import pino from 'pino';
import path from 'path';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL) || Boolean(process.env.NEXT_RUNTIME);
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
    const getLogFilePath = () => {
        try {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            const logDir = path.resolve(process.cwd(), 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            return path.join(logDir, `${dd}_${mm}_${yyyy}_pahadigo.log`);
        } catch (e) {
            return null;
        }
    };

    const logFilePath = getLogFilePath();

    const targets = [];
    if (logFilePath) {
        targets.push({
            target: 'pino/file',
            options: {
                destination: logFilePath,
                mkdir: true,
            },
        });
    }

    if (!isProduction) {
        targets.push({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        });
    }

    const transport = targets.length > 0 ? pino.transport({ targets }) : undefined;

    logger = pino(
        {
            level: process.env.LOG_LEVEL || 'info',
            formatters: {
                level: (label) => ({ level: label.toUpperCase() }),
            },
            timestamp: pino.stdTimeFunctions.isoTime,
        },
        transport
    );
}

export const getLogger = (requestId) => {
    if (requestId) {
        return logger.child({ requestId });
    }
    return logger;
};

export default logger;
