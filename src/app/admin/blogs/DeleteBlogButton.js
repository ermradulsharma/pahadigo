"use client";
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import api from '@/core/Api/index.js';
import Button from '@/components/ui/Button.js';
import { useToast } from '@/components/ui/ToastContext.js';

export default function DeleteBlogButton({ blogId }) {
    const router = useRouter();
    const toast = useToast();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        try {
            const res = await api.admin.blogs.delete(blogId);
            if (res.success) {
                toast('Blog deleted successfully', 'success');
                router.refresh();
            } else {
                toast(res.error || 'Failed to delete blog', 'error');
            }
        } catch (error) {
            toast('Failed to delete blog', 'error');
        }
    };

    return (
        <Button 
            variant="danger" 
            size="icon" 
            onClick={handleDelete} 
            icon={Trash2}
            title="Delete Blog"
        />
    );
}
