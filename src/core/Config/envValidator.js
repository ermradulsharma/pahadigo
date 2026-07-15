import { z } from 'zod';
import chalk from 'chalk';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long for security"),
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL").optional(),
});

export const validateEnv = () => {
  // Allow bypass in test mode so Jest tests don't immediately crash if lacking .env
  if (process.env.NODE_ENV === 'test') return;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(chalk.red.bold('❌ Invalid environment variables:'));
    parsed.error.issues.forEach(issue => {
      console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
    });
    console.error(chalk.red.bold('\nExiting application due to critical environment failure.'));
    process.exit(1);
  }
};
