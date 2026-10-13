import PackageService from '@/core/Services/Admin/PackageService.js';
import PackageItemClientWrapper from './PackageItemClientWrapper.js';

export const metadata = {
    title: 'Package Node Configuration | PahadiGo Admin',
    description: 'Inspect and mutate inventory package node payload.'
};

export default async function AdminPackageItemPage({ params }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    let item = null;
    try {
        const fetched = await PackageService.getPackageItem(id);
        if (fetched) {
            item = JSON.parse(JSON.stringify(fetched));
        }
    } catch (e) {
        item = null;
    }

    return (
        <PackageItemClientWrapper
            initialItem={item}
            itemId={id}
        />
    );
}
