import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, ...value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
                }
            });
        }
    } catch (e) {}
}

loadEnv();

import dbConnect from '../Config/db.js';
import VendorDocument from '../Models/VendorDocument.js';

async function killHotel() {
    await dbConnect();
    const result = await VendorDocument.deleteMany({ category_slug: 'hotel' });
    console.log(`Deleted ${result.deletedCount} documents for Hotel category.`);
    process.exit(0);
}

killHotel();
