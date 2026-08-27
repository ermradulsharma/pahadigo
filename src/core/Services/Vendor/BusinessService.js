import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import { getBusinessBy, getBusinessById as qhGetBusinessById, getBusinessByUserId as qhGetBusinessByUserId, getPackageBy, getManyBy } from '@/core/Helpers/queryHelpers.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import User from '@/core/Models/User.js';
import Review from '@/core/Models/Review.js';
import Booking from '@/core/Models/Booking.js';
import Dispute from '@/core/Models/Dispute.js';
import VendorClosure from '@/core/Models/VendorClosure.js';
import { STATUS } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';

class BusinessService {
    // Constructor
    constructor() {
        this.activeStatus = STATUS.ACTIVE;
    }

    // Helper to invalidate vendor profile caches
    async invalidateVendorCaches(userId, vendorId = null) {
        await CacheService.del('admin:vendors:all');
        await CacheService.del('admin:dashboard:stats');
        if (userId) {
            await CacheService.del(`admin:vendors:${userId}`);
            await CacheService.del(`user:profile:${userId}`);
        }
        if (vendorId) {
            await CacheService.del(`admin:vendors:${vendorId}`);
        }
    }

    // Sync Business Profile (Handles Update/Create)
    async syncBusinessProfile(userId, profileData) {
        const updateData = { ...profileData };
        if (profileData.documents) {
            delete updateData.documents;
            for (const key in profileData.documents) {
                if (profileData.documents[key] !== undefined) {
                    const docObj = profileData.documents[key];
                    if (typeof docObj === 'object' && docObj !== null && !Array.isArray(docObj)) {
                        updateData[`documents.${key}`] = {
                            ...docObj,
                            status: 'pending'
                        };
                    } else {
                        updateData[`documents.${key}`] = docObj;
                    }
                }
            }
        }
        if (profileData.bankDetails) {
            delete updateData.bankDetails;
            for (const key in profileData.bankDetails) {
                if (profileData.bankDetails[key] !== undefined) {
                    updateData[`bankDetails.${key}`] = profileData.bankDetails[key];
                }
            }
        }
        if (profileData.businessCategory && Array.isArray(profileData.businessCategory)) {
            const categories = await getManyBy(Category, { slug: { $in: profileData.businessCategory } });
            updateData.category = (categories || []).map(cat => ({
                _id: cat._id,
                name: cat.name,
                slug: cat.slug
            }));
            delete updateData.businessCategory;
        }
        if (updateData.address) {
            mapToGeoJSON(updateData.address, 'location');
        }

        const vendor = await Vendor.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                ...updateData,
                deletedAt: null,
                deletedBy: null
            },
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        await User.findByIdAndUpdate(userId, { vendorProfile: vendor._id, name: vendor.ownerName }, { returnDocument: 'after' });

        await this.invalidateVendorCaches(userId, vendor._id);

        return await vendor.populate('user', 'email phone role');
    }

    // Fetch Business Record by User ID using queryHelpers
    async getBusinessByUserId(userId, select = '', populate = { path: 'user', select: 'email phone role' }) {
        const vendor = await qhGetBusinessByUserId(userId, select, populate);
        if (vendor) {
            const closures = await getManyBy(VendorClosure, { vendor: vendor._id, isActive: true }, '', null, { startDate: 1 });
            vendor.closurePeriods = closures;
        }
        return vendor;
    }

    // Retrieve Business Identity
    async getBusinessProfile(userId) {
        return await this.getBusinessByUserId(userId);
    }

    // Soft Delete Business Profile
    async removeBusinessProfile(userId, deletedBy) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { deletedAt: new Date(), deletedBy: deletedBy },
            { returnDocument: 'after' }
        );
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor;
    }

    // Logic to evaluate and update the trust badge based on performance
    async calculateTrustBadge(vendorId) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return null;

        let newBadge = 'none';

        // Base criteria for "verified": Must be approved and documents verified
        const isAadharVerified = vendor.documents?.aadharCard?.[0]?.status === 'verified';
        const isPanVerified = vendor.documents?.panCard?.status === 'verified';
        let isBusinessRegistrationVerified = true;
        if (vendor.profileType === 'business') {
            isBusinessRegistrationVerified = vendor.documents?.businessRegistration?.status === 'verified';
        }

        const isVerified = vendor.status === this.activeStatus && isAadharVerified && isPanVerified && isBusinessRegistrationVerified;

        if (isVerified) {
            newBadge = 'verified';

            // Query vendor package using correct field schema name (vendor)
            const catalog = await getPackageBy({ vendor: vendorId });

            if (catalog) {
                const totalBookings = await Booking.countDocuments({ vendor: vendorId, status: 'completed' });

                if (totalBookings >= 10) {
                    const disputeCount = await Dispute.countDocuments({ vendor: vendorId, status: 'resolved_refunded' });
                    const disputeRate = disputeCount / totalBookings;

                    const reviewStats = await Review.aggregate([
                        { $match: { vendor: vendor._id } },
                        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
                    ]);

                    const avgRating = reviewStats.length > 0 ? reviewStats[0].avgRating : 0;

                    if (avgRating >= 4.5 && disputeRate <= 0.05) {
                        newBadge = 'super_partner';
                    }
                }
            }
        }

        if (vendor.trustBadge !== newBadge) {
            vendor.trustBadge = newBadge;
            await vendor.save();
            await this.invalidateVendorCaches(vendor.user, vendor._id);
        }

        return newBadge;
    }

    // Update Verification/Moderation Status
    async updateBusinessStatus(userId, status) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { status: status },
            { returnDocument: 'after' }
        );
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor;
    }

    // Toggle Operational/Availability status
    async toggleOperatingStatus(userId, isOperating) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { isOperating: isOperating },
            { returnDocument: 'after' }
        );
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor;
    }

    async getBusinessById(id, select = '', populate = { path: 'user', select: 'email phone role' }) {
        return await qhGetBusinessById(id, select, populate);
    }

    async getPublicBusinessProfile(id) {
        return await qhGetBusinessById(id, 'businessAbout businessName businessNumber businessRegistration gstNumber ownerName status trustBadge address category profileImage');
    }
}

export default new BusinessService();
