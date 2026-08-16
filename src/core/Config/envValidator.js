import { z } from 'zod';
import chalk from 'chalk';
import { getLogger } from '../Lib/logger.js';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('3000'),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long for security"),
    NEXT_PUBLIC_API_URL: z.union([z.string().url("NEXT_PUBLIC_API_URL must be a valid URL"), z.literal('')]).optional(),
    QSTASH_TOKEN: z.union([z.string().min(1, "QSTASH_TOKEN is required for async queues"), z.literal('')]).optional(),
    CLOUDINARY_URL: z.union([z.string().url("CLOUDINARY_URL is required for media processing"), z.literal('')]).optional(),
    RAZORPAY_KEY_ID: z.union([z.string().min(1, "RAZORPAY_KEY_ID is required for payments"), z.literal('')]).optional(),
    RAZORPAY_KEY_SECRET: z.union([z.string().min(1, "RAZORPAY_KEY_SECRET is required for payments"), z.literal('')]).optional(),
    UPSTASH_REDIS_REST_URL: z.union([z.string().url("UPSTASH_REDIS_REST_URL is required for rate-limiting and caching"), z.literal('')]).optional(),
    UPSTASH_REDIS_REST_TOKEN: z.union([z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"), z.literal('')]).optional(),
});

export const validateEnv = () => {
    if (process.env.NODE_ENV === 'test') return;
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const logger = getLogger();
        parsed.error.issues.forEach(issue => {
            const msg = `  - ${issue.path.join('.')}: ${issue.message}`;
            console.error(chalk.red(msg));
            logger.error({ field: issue.path.join('.'), issue: issue.message }, `[ENV VALIDATION ERROR] ${issue.path.join('.')}: ${issue.message}`);
        });
        console.error(chalk.red.bold('\nExiting application due to critical environment failure.'));
        logger.error('[ENV VALIDATION FAILED] Exiting application due to critical environment configuration failure.');
        process.exit(1);
    }
};
