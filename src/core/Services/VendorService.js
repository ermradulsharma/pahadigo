import Vendor from '@/models/Vendor.js';

class VendorService {
    async upsertProfile(userId, profileData) {
        const updateData = { ...profileData };
        if (profileData.documents) {
            delete updateData.documents;
            for (const key in profileData.documents) {
                updateData[`documents.${key}`] = profileData.documents[key];
            }
        }

        const vendor = await Vendor.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                ...updateData
            },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: false }
        );
        return vendor;
    }

    async findByUserId(userId) {
        return await Vendor.findOne({ user: userId });
    }

    async getFullProfile(userId) {
        return await Vendor.findOne({ user: userId })
            .populate('user', 'email phone role')
            .populate('category', '_id name slug')
            .lean();
    }

    getCategories() {
        return [
            'Homestay',
            'Hotel',
            'Camping',
            'Trekking',
            'Cafe/Restaurant',
            'Bike/Car Rental',
            'Adventure Sports',
            'Rafting', // Added to match Package Schema
            'Bungee Jumping',
            'Taxi/Driver',
            'Local Guide',
            'Temple Darshan',
            'Chardham Tour'
        ];
    }
}

const vendorService = new VendorService();
export default vendorService;