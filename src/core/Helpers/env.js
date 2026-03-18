import fs from 'fs';
import path from 'path';

export const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split(/\r?\n/).forEach(line => {
                const index = line.indexOf('=');
                if (index > 0) {
                    const key = line.substring(0, index).trim();
                    const value = line.substring(index + 1).trim();
                    if (key && value) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) {
    }
};
