const Vendor = require('../models/Vendor');

class VendorService {
    async upsertProfile(userId, profileData) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                ...profileData
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return vendor;
    }

    async findByUserId(userId) {
        return await Vendor.findOne({ user: userId });
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
            'Bungee Jumping',
            'Taxi/Driver',
            'Local Guide',
            'Temple Darshan',
            'Chardham Tour'
        ];
    }
}

module.exports = new VendorService();
