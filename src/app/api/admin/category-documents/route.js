import { NextResponse } from 'next/server';
import categoryDocumentService from '@/services/CategoryDocumentService';
import connectDB from '@/config/db';
import { HTTP_STATUS } from '@/constants/index';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const category_slug = searchParams.get('category_slug');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;

        const filter = {};
        if (category_slug) filter.category_slug = category_slug;

        const documents = await categoryDocumentService.getAll(filter, page, limit);
        return NextResponse.json({ success: true, data: documents });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const document = await categoryDocumentService.create(body);
        return NextResponse.json({ success: true, data: document }, { status: HTTP_STATUS.CREATED });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: HTTP_STATUS.BAD_REQUEST });
    }
}
