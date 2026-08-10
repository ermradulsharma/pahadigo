'use client';
import { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, CheckCircle2, Clock, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader.js';
import CyberTable from '@/components/admin/CyberTable.js';
import DeleteBlogButton from './DeleteBlogButton.js';

export default function BlogsTableClient({ initialBlogs, totalItems, initialPage, initialSearch }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchQuery, setSearchQuery] = useState(initialSearch || '');

    // Debounce search URL update
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchQuery !== initialSearch) {
                if (searchQuery) params.set('search', searchQuery);
                else params.delete('search');
                params.set('page', '1');
                
                startTransition(() => {
                    router.push(`${pathname}?${params.toString()}`);
                });
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, pathname, router, searchParams, initialSearch]);

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const columns = [
        {
            header: 'Title & Slug',
            accessor: 'title', // For sorting
            className: 'w-1/3',
            render: (blog) => (
                <div className="flex flex-col items-start gap-1">
                    <div className="font-bold text-slate-200">{blog.title}</div>
                    <div className="text-xs font-mono text-slate-500 mt-1 truncate max-w-[250px]">/{blog.slug}</div>
                </div>
            )
        },
        {
            header: 'Author',
            accessor: 'author.name',
            tdClassName: 'text-sm text-slate-300',
            render: (blog) => blog.author?.name || 'Admin'
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (blog) => {
                if (blog.status === 'published') {
                    return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Published</div>;
                }
                return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" /> Draft</div>;
            }
        },
        {
            header: 'Published Date',
            accessor: 'publishedAt',
            tdClassName: 'text-sm text-slate-400',
            render: (blog) => blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'
        },
        {
            header: 'Actions',
            className: 'text-right',
            tdClassName: 'text-right',
            render: (blog) => (
                <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/blogs/${blog._id}/edit`} className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-md transition-colors border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                        <Edit2 className="w-4 h-4" />
                    </Link>
                    <DeleteBlogButton blogId={blog._id.toString()} />
                </div>
            )
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <PageHeader 
                title="Blog Management" 
                subtitle="Create, edit, and manage your platform's publications" 
                icon={FileText} 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
                actionLabel="New Post" 
                actionIcon={Plus} 
                onAction={() => router.push('/admin/blogs/create')} 
            />

            <CyberTable 
                data={initialBlogs} 
                columns={columns} 
                itemsPerPage={10} 
                loading={isPending}
                loadingText="Syncing Data..."
                emptyText={searchQuery ? 'No blogs found for your search.' : 'No blogs have been published yet.'}
                exportFilename="blogs_export"
                
                // Server-side Pagination Overrides
                totalItems={totalItems}
                externalCurrentPage={initialPage}
                onPageChange={handlePageChange}
                
                // Disable client search since we do it via URL/Server
                searchable={false} 
            />
        </div>
    );
}
