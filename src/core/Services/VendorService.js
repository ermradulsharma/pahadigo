import Vendor from '@/models/Vendor.js';
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
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
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
            { new: true }
        );
    }

    async addCategory(userId, categoryData) {
        // categoryData should be { _id, name, slug }
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $addToSet: { category: categoryData } },
            { new: true }
        );
    }

    async removeCategory(userId, categorySlug) {
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $pull: { category: { slug: categorySlug } } },
            { new: true }
        );
    }

    async deleteBankDetails(userId) {
        return await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $unset: { bankDetails: "" } },
            { new: true }
        ).populate('user', 'email phone role');
    }

    getCategories() {
        return Object.values(CATEGORY_TITLES);
    }
}

const vendorService = new VendorService();
export default vendorService;