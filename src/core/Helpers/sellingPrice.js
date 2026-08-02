import { getAppConfig } from '@/core/Lib/appConfig.js';

export async function sellingPrice(pricing, category = null) {
    if (!pricing) return;
    const basePrice = parseFloat(pricing.basePrice);
    if (!isNaN(basePrice)) {
        let gst = parseFloat(pricing.gst);

        // If GST is zero, null, or NaN, apply from setting based on category
        if (!gst && category) {
            const config = await getAppConfig();
            const taxKey = `tax_${category.replace(/-/g, '_')}`;
            gst = parseFloat(config.tax[taxKey]);
            if (isNaN(gst)) gst = 0;
            pricing.gst = gst; // Store the applied setting back to the pricing object
        } else if (isNaN(gst)) {
            gst = 0;
        }

        const discount = parseFloat(pricing.discount) || 0;
        const discountType = pricing.discountType || 'flat';

        let discountAmount = 0;
        if (discountType === 'percentage') discountAmount = basePrice * (discount / 100);
        if (discountType === 'flat') discountAmount = discount;
        
        const gstAmount = basePrice * (gst / 100);
        const calculatedSellingPrice = Math.max(0, basePrice + gstAmount - discountAmount);
        
        const rawSellingPrice = pricing.sellingPrice;
        const isSellingPriceEmpty =
            rawSellingPrice === undefined ||
            rawSellingPrice === null ||
            rawSellingPrice === '' ||
            (typeof rawSellingPrice === 'string' && rawSellingPrice.trim() === '') ||
            (typeof rawSellingPrice === 'number' && rawSellingPrice === 0 && calculatedSellingPrice > 0) ||
            (typeof rawSellingPrice === 'string' && parseFloat(rawSellingPrice) === 0 && calculatedSellingPrice > 0);
            
        if (isSellingPriceEmpty) pricing.sellingPrice = calculatedSellingPrice;
    }
}
