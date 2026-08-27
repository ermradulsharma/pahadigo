import pino from 'pino';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

const getLogFilePath = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    return path.join(logDir, `${dd}_${mm}_${yyyy}_pahadigo.log`);
};

const logFilePath = getLogFilePath();

const targets = [
    {
        target: 'pino/file',
        options: {
            destination: logFilePath,
            mkdir: true,
        },
    },
];

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

const transport = pino.transport({ targets });

const logger = pino(
    {
        level: process.env.LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    transport
);

export const getLogger = (requestId) => {
    if (requestId) {
        return logger.child({ requestId });
    }
    return logger;
};

export default logger;
