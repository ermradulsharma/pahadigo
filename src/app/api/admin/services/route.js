import { NextResponse } from 'next/server';
import serviceDocumentService from '@/services/ServiceDocumentService';
import connectDB from '@/config/db';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const category_slug = searchParams.get('category_slug');

        const filter = {};
        if (category_slug) filter.category_slug = category_slug;

        const documents = await serviceDocumentService.getAll(filter);
        return NextResponse.json({ success: true, data: documents });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const document = await serviceDocumentService.create(body);
        return NextResponse.json({ success: true, data: document }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
