import fs from 'fs';
import path from 'path';
import { validateEnv } from '../Config/envValidator.js';

export const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split(/\r?\n/).forEach(line => {
                const trimmedLine = line.trim();
                // Ignore comments
                if (trimmedLine.startsWith('#')) return;
                
                const index = trimmedLine.indexOf('=');
                if (index > 0) {
                    const key = trimmedLine.substring(0, index).trim();
                    let value = trimmedLine.substring(index + 1).trim();
                    // Remove quotes if present
                    value = value.replace(/(^"|"$)/g, '').replace(/(^'|'$)/g, '');
                    
                    if (key && value && process.env[key] === undefined) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error loading .env", e);
    }
    
    // Validate the environment after variables are loaded
    validateEnv();
};

loadEnv();

export default { loadEnv };
