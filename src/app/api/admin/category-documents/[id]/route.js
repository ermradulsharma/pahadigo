import { NextResponse } from 'next/server';
import categoryDocumentService from '@/services/CategoryDocumentService';
import connectDB from '@/config/db';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const document = await categoryDocumentService.getById(id);
        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: HTTP_STATUS.NOT_FOUND });
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        const document = await categoryDocumentService.update(id, body);
        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(k => error.errors[k].message) : null
        }, { status: HTTP_STATUS.BAD_REQUEST });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        await categoryDocumentService.delete(id);
        return NextResponse.json({ success: true, message: RESPONSE_MESSAGES.SUCCESS.DELETE });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: HTTP_STATUS.BAD_REQUEST });
    }
}
