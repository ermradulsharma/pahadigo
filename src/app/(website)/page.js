import connectDB from '@/config/db';
import Category from '@/models/Category';
import ClientHome from './ClientHome';

export const metadata = {
    title: 'PahadiGo - Your Himalayan Adventure Awaits',
    description: 'Find your perfect escape with curated trekking, camping, and adventure experiences in the heart of the Himalayas.',
};

async function getCategories() {
    try {
        const conn = await connectDB();
        if (!conn) return [];
        // Plain object for serialization
        const categories = await Category.find({ isActive: true }).select('name slug description').lean();
        return categories.map(cat => ({
            ...cat,
            _id: cat._id.toString()
        }));
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}

export default async function Home() {
    const categories = await getCategories();

    return (
        <ClientHome categories={categories} />
    );
}
