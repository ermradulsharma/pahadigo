export function sellingPrice(pricing) {
    if (!pricing) return;
    const basePrice = parseFloat(pricing.basePrice);
    if (!isNaN(basePrice)) {
        const gst = parseFloat(pricing.gst) || 0;
        const discount = parseFloat(pricing.discount) || 0;
        const discountType = pricing.discountType || 'flat';

        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = basePrice * (discount / 100);
        } else if (discountType === 'flat') {
            discountAmount = discount;
        }
        const gstAmount = basePrice * (gst / 100);
        const calculatedSellingPrice = Math.max(0, basePrice + gstAmount - discountAmount);
        const rawSellingPrice = pricing.sellingPrice;
        const isSellingPriceEmpty = rawSellingPrice === undefined || rawSellingPrice === null || rawSellingPrice === '' || (typeof rawSellingPrice === 'string' && rawSellingPrice.trim() === '') || (typeof rawSellingPrice === 'number' && rawSellingPrice === 0 && calculatedSellingPrice > 0) || (typeof rawSellingPrice === 'string' && parseFloat(rawSellingPrice) === 0 && calculatedSellingPrice > 0);
        if (isSellingPriceEmpty) {
            pricing.sellingPrice = calculatedSellingPrice;
        }
    }
}
