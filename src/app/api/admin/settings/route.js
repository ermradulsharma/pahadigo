
import connectDB from '@/config/db';
import Setting from '@/models/Setting';
import { NextResponse } from 'next/server';

export async function GET() {
    await connectDB();
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = await Setting.create({});
        }
        return NextResponse.json({ success: true, data: setting });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
        return NextResponse.json({ success: true, data: setting, message: 'Settings updated successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
