import Vendor from '@/models/Vendor.js';
import Review from '@/models/Review.js';
import Booking from '@/models/Booking.js';
import Dispute from '@/models/Dispute.js';
import Package from '@/models/Package.js';
import { CATEGORY_TITLES } from '@/constants/categories.js';

class VendorService {
    async upsertProfile(userId, profileData) {
        const updateData = { ...profileData };
        if (profileData.documents) {
            delete updateData.documents;
            for (const key in profileData.documents) {
                if (profileData.documents[key] !== undefined) {
                    updateData[`documents.${key}`] = profileData.documents[key];
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

        const { businessName, description, address, socialLinks, contactEmail, contactPhone } = profileData;
        const validProfileData = {
            businessName,
            description,
            address,
            socialLinks,
            contactEmail,
            contactPhone
        };

        const vendor = await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            {
                user: userId,
                ...validProfileData,
                ...updateData,
                deletedAt: null,
                deletedBy: null
            },
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
        ).populate('user', 'email phone role');
        return vendor;
    }

    async findByUserId(userId) {
        return await Vendor.findOne({ user: userId, deletedAt: null }).populate('user', 'email phone role');
    }

    async getFullProfile(userId) {
        return await Vendor.findOne({ user: userId, deletedAt: null }).populate('user', 'email phone role');
    }

    async deleteProfile(userId, deletedBy) {
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            {
                deletedAt: new Date(),
                deletedBy: deletedBy
            },
            { returnDocument: 'after' }
        );
    }

    async addCategory(userId, categoryData) {
        // categoryData should be { _id, name, slug }
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $addToSet: { category: categoryData } },
            { returnDocument: 'after' }
        );
    }

    async removeCategory(userId, categorySlug) {
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $pull: { category: { slug: categorySlug } } },
            { returnDocument: 'after' }
        );
    }

    async deleteBankDetails(userId) {
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $unset: { bankDetails: "" } },
            { returnDocument: 'after' }
        ).populate('user', 'email phone role');
    }

    getCategories() {
        return Object.values(CATEGORY_TITLES);
    }

    async evaluateVendorTrustBadge(vendorId) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return null;

        let newBadge = 'none';

        // Base criteria for "verified": Must be approved and documents verified
        const isAadharVerified = vendor.documents?.aadharCard?.[0]?.status === 'verified';
        const isPanVerified = vendor.documents?.panCard?.status === 'verified';
        // For business profile type, registration must also be verified
        let isBusinessRegistrationVerified = true;
        if (vendor.profileType === 'business') {
            isBusinessRegistrationVerified = vendor.documents?.businessRegistration?.status === 'verified';
        }

        const isVerified = vendor.isApproved && isAadharVerified && isPanVerified && isBusinessRegistrationVerified;

        if (isVerified) {
            newBadge = 'verified';

            // Now evaluate for "super_partner"
            // Criteria: avgRating >= 4.5, totalBookings >= 10, dispute rate <= 5%

            const catalog = await Package.findOne({ vendor: vendorId });
            
            if (catalog) {
                const totalBookings = await Booking.countDocuments({ package: catalog._id, status: 'completed' });
                
                if (totalBookings >= 10) {
                    const disputeCount = await Dispute.countDocuments({ vendorId: vendorId, status: 'resolved_refunded' });
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
        }

        return newBadge;
    }
}

const vendorService = new VendorService();
export default vendorService;