import connectDB from '@/config/db';
import Setting from '@/models/Setting';
import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/constants/index';

export async function GET() {
    await connectDB();
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = await Setting.create({});
        }
        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: HTTP_STATUS.BAD_REQUEST });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const body = await req.json();
        let setting = await Setting.findOne();
        if (!setting) {
            setting = new Setting(body);
        } else {
            Object.assign(setting, body);
        }
        await setting.save();
        return NextResponse.json({ success: true, data: setting, message: RESPONSE_MESSAGES.SUCCESS.UPDATE });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: HTTP_STATUS.BAD_REQUEST });
    }
}
