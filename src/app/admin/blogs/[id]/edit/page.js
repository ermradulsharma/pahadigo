import BlogForm from '../../BlogForm.js';
import BlogService from '@/core/Services/Admin/BlogService.js';
import dbConnect from '@/core/Config/db.js';

export const metadata = {
    title: 'Edit Blog Post - Admin Dashboard',
};

// Next.js App Router RSC
export default async function EditBlogPage({ params }) {
    await dbConnect();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    let blog = null;
    let error = null;

    try {
        blog = await BlogService.getBlogById(id);
    } catch (e) {
        error = e.message || 'Failed to fetch blog data';
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="p-4 bg-rose-950/80 border border-rose-500/30 text-rose-400 rounded-xl text-center shadow-xl">
                    {error}
                </div>
            </div>
        );
    }

    // Pass pure JSON data to the client component, removing Mongoose specific prototype methods
    const initialData = JSON.parse(JSON.stringify(blog));

    return <BlogForm initialData={initialData} />;
}
