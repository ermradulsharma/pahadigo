import { NextResponse } from 'next/server';
import categoryDocumentService from '@/services/CategoryDocumentService';
import connectDB from '@/config/db';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const document = await categoryDocumentService.getById(id);
        return NextResponse.json({ success: true, data: document });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
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
        console.error('Update Category Document Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(k => error.errors[k].message) : null
        }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        await categoryDocumentService.delete(id);
        return NextResponse.json({ success: true, message: 'Category Document deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
