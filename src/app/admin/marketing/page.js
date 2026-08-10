import MarketingService from '@/core/Services/Admin/MarketingService.js';
import MarketingClientWrapper from './MarketingClientWrapper.js';

export const metadata = {
    title: 'Marketing & Promotions | Admin Dashboard',
    description: 'Manage banners and coupons.'
};

export default async function MarketingPage() {
    let rawBanners = [];
    let rawCoupons = [];

    try {
        const [banners, coupons] = await Promise.all([
            MarketingService.getBanners(),
            MarketingService.getCoupons()
        ]);
        rawBanners = banners;
        rawCoupons = coupons;
    } catch (e) {
        // Handle silently
    }

    const initialBanners = JSON.parse(JSON.stringify(rawBanners || []));
    const initialCoupons = JSON.parse(JSON.stringify(rawCoupons || []));

    return <MarketingClientWrapper initialBanners={initialBanners} initialCoupons={initialCoupons} />;
}
