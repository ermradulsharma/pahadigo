import dbConnect from '@/core/Config/db.js';
import BlogService from '@/core/Services/Admin/BlogService.js';
import BlogsTableClient from './BlogsTableClient.js';

export const metadata = {
    title: 'Blog Management - Admin',
};

export const dynamic = 'force-dynamic';

export default async function BlogsPage({ searchParams }) {
    await dbConnect();
    
    // In Next.js 15+, searchParams is a Promise. We await it.
    const searchParamsResolved = await searchParams;
    const page = parseInt(searchParamsResolved?.page) || 1;
    const search = searchParamsResolved?.search || '';
    
    const filters = {};
    if (search) filters.$text = { $search: search };

    const result = await BlogService.getBlogs(filters, page, 10);
    
    // We parse/stringify to remove Mongoose Document prototypes for Client Component boundaries
    const blogs = JSON.parse(JSON.stringify(result.docs || []));

    return (
        <BlogsTableClient 
            initialBlogs={blogs} 
            totalItems={result.total || 0} 
            initialPage={page} 
            initialSearch={search} 
        />
    );
}
