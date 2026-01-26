import { NextResponse } from 'next/server';
import categoryDocumentService from '@/services/CategoryDocumentService';
import connectDB from '@/config/db';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const document = await categoryDocumentService.getById(params.id);
        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const body = await request.json();
        const document = await categoryDocumentService.update(params.id, body);
        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        await categoryDocumentService.delete(params.id);
        return NextResponse.json({ success: true, message: 'Category Document deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
