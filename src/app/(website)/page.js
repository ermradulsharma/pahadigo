import ClientHome from './ClientHome.js';

export const metadata = {
    title: 'PahadiGo - Your Himalayan Adventure Awaits',
    description: 'Find your perfect escape with curated trekking, camping, and adventure experiences in the heart of the Himalayas.',
};

async function getCategories() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/categories`, { cache: 'no-store' });
        if (!res.ok) return [];
        const result = await res.json();
        return result.data || [];
    } catch (error) {
        return [];
    }
}

export default async function Home() {
    const categories = await getCategories();
    return (
        <ClientHome categories={categories} />
    );
}
