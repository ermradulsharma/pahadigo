import dbConnect from './src/core/Config/db.js';
import PackageController from './src/core/Http/Controllers/General/PackageController.js';
import { loadEnv } from './src/core/Helpers/env.js';

async function test() {
    loadEnv();
    await dbConnect();
    const req = {
        url: 'http://localhost:3000/api/packages?page=1&limit=10',
        headers: new Map()
    };
    const response = await PackageController.browsePackages(req);
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));
    process.exit(0);
}

test();
