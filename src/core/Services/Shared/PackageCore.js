import Package from '@/core/Models/Package.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import MasterService from '@/core/Services/MasterService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { getPackageItemById } from '@/core/Helpers/queryHelpers.js';
import { businessPayload } from '@/core/Helpers/userProfileHelper.js';

/**
 * Shared core logic to retrieve an available package item with populated business & compliance checks.
 * @param {string} itemId - Package item ObjectId string
 * @param {Object} masterService - MasterService instance
 * @returns {Promise<Object|null>} Available package item or null
 */
export async function getItemDetailsPayload(itemId, masterService = MasterService) {
    if (!itemId) return null;

    const item = await getPackageItemById(itemId);
    if (!item) return null;

    const pkg = await Package.findById(item.catalogId).populate({ path: 'vendor', populate: { path: 'user' } }).lean();
    if (!pkg || !(await masterService.isVendorActive(pkg.vendor))) return null;

    const slug = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === item.category) || item.category;
    const isCategoryVerified = await VendorDocument.findOne({ vendor: pkg.vendor._id, category_slug: slug, status: 'verified' });
    if (!isCategoryVerified) return null;

    if (item.isActive === false) return null;

    const config = await getAppConfig();
    if (item.pricing) item.pricing.serviceTax = config.tax?.service_tax || 0;

    if (pkg.vendor) {
        const businessObj = businessPayload(pkg.vendor);
        item.business = businessObj;
    }

    return item;
}

export default {
    getItemDetailsPayload
};
