import { NextResponse } from 'next/server';
import connectDB from '@/core/Config/db.js';
import CronService from '@/core/Services/CronService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        const config = await getAppConfig();

        // Secure the cron endpoint using Vercel's standard CRON_SECRET approach
        // Vercel sends `Bearer <CRON_SECRET>` in the Authorization header
        if (authHeader !== `Bearer ${config.secrets?.cron_secret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Connect to the database
        await connectDB();

        // Get the specific job to run from the URL query params
        const url = new URL(req.url);
        const job = url.searchParams.get('job');

        let result = null;

        // Route to the appropriate service method based on the job requested
        switch (job) {
            case 'dailyBookings':
                result = await CronService.autoCompleteBookings();
                break;
            case 'expireBookings':
                result = await CronService.autoExpireBookings();
                break;
            case 'resolveDisputes':
                result = await CronService.autoResolveDisputes();
                break;
            case 'cleanupLogs':
                result = await CronService.cleanupLogs();
                break;
            case 'all':
                // For manual triggers or broad schedules
                result = {
                    completed: await CronService.autoCompleteBookings(),
                    expired: await CronService.autoExpireBookings(),
                    resolved: await CronService.autoResolveDisputes(),
                    cleaned: await CronService.cleanupLogs()
                };
                break;
            default:
                return NextResponse.json({ error: 'Invalid or missing job specified' }, { status: 400 });
        }

        return NextResponse.json({ success: true, job, result }, { status: 200 });
    } catch (error) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
