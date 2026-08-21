import { getAppConfig } from '@/core/Lib/appConfig.js';
import { toFixed2 } from './mathUtils.js';

export async function sellingPrice(pricingInput, category, currentPricing = {}) {
    if (!pricingInput || typeof pricingInput !== 'object') return currentPricing;

    const currentBasePrice = currentPricing.basePrice || 0;
    const basePrice = toFixed2(parseFloat(pricingInput.basePrice)) || toFixed2(parseFloat(currentBasePrice));

    // check GST is zero or null
    const inputGST = pricingInput.gst !== undefined ? pricingInput.gst : (currentPricing.gst !== undefined ? currentPricing.gst : 0);
    // const inputGST = pricingInput.gst || currentPricing.gst || 0;
    const isProvided = inputGST !== undefined && inputGST !== null && String(inputGST).trim() !== '';
    const parsedNumber = isProvided ? parseFloat(inputGST) : null;
    const isParseGST = !isNaN(parsedNumber) ? parsedNumber : null;
    const checkNullGST = !isProvided || isNaN(parsedNumber) || parsedNumber === 0;

    let finalGST;
    if (checkNullGST) {
        const config = await getAppConfig();
        const taxKey = `tax_${category.replace(/-/g, '_')}`;
        finalGST = parseFloat(config.tax[taxKey]) || 0;
    } else {
        finalGST = isParseGST;
    }
    const sellingPrice = toFixed2(parseFloat(basePrice) * (1 + finalGST / 100));

    const structuredPricing = {
        ...currentPricing,
        basePrice: basePrice,
        gst: finalGST,
        discountType: pricingInput.discountType || currentPricing.discountType || 'flat',
        discount: toFixed2(parseFloat(pricingInput.discount)) || toFixed2(parseFloat(currentPricing.discount || 0)),
        sellingPrice: sellingPrice,
        maxGuests: parseInt(pricingInput.maxGuests, 10) || parseInt(currentPricing.maxGuests || 0),
        maxAdults: parseInt(pricingInput.maxAdults, 10) || parseInt(currentPricing.maxAdults || 0),
        maxChildren: parseInt(pricingInput.maxChildren, 10) || parseInt(currentPricing.maxChildren || 0),
        childPrice: toFixed2(parseFloat(pricingInput.childPrice)) || toFixed2(parseFloat(currentPricing.childPrice || 0)),
        extraBedAvailable: pricingInput.extraBedAvailable !== undefined ? Boolean(pricingInput.extraBedAvailable === true || pricingInput.extraBedAvailable === 'true') : (currentPricing.extraBedAvailable || false),
        extraBedPrice: toFixed2(parseFloat(pricingInput.extraBedPrice)) || toFixed2(parseFloat(currentPricing.extraBedPrice || 0))
    };
    return structuredPricing;
}

export default sellingPrice;
