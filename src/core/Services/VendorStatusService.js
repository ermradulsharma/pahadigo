import Vendor from '@/models/Vendor.js';
import VendorClosure from '@/models/VendorClosure.js';
import { STATUS } from '@/constants/index.js';

/**
 * VendorStatusService (General/Traveller Role)
 * Focuses on determining vendor availability for search results and booking.
 */
class VendorStatusService {
    constructor() {
        this.activeStatus = STATUS.ACTIVE;
    }

    /**
     * Checks availability for customer-facing displays (includes closure periods).
     */
    async isVendorAvailable(vendorIdOrUser, isUserId = true) {
        const query = isUserId ? { user: vendorIdOrUser } : { _id: vendorIdOrUser };
        const vendor = await Vendor.findOne({ ...query, deletedAt: null }).lean();

        if (!vendor || vendor.status !== this.activeStatus || !vendor.isOperating) return false;

        const now = new Date();
        const closure = await VendorClosure.findOne({
            vendor: vendor._id,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (closure) return false;

        return true;
    }

    /**
     * Aggregation helper to filter out inactive vendors in pipelines.
     */
    getVendorClosureFilterStages(vendorField = 'vendorProfile') {
        const now = new Date();
        return [
            {
                $lookup: {
                    from: 'vendorclosures',
                    let: { vendorId: `$${vendorField}._id` },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$vendor", "$$vendorId"] },
                                        { $eq: ["$isActive", true] },
                                        { $lte: ["$startDate", now] },
                                        { $gte: ["$endDate", now] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activeClosures'
                }
            },
            { $match: { "activeClosures": { $size: 0 } } },
            { $project: { activeClosures: 0 } }
        ];
    }

    /**
     * Standard query helper for find() calls.
     */
    getVendorClosureQuery(prefix = '') {
        const p = prefix ? `${prefix}.` : '';
        return {
            [`${p}status`]: this.activeStatus,
            [`${p}isOperating`]: true
        };
    }
}

export default new VendorStatusService();
