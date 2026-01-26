import mongoose from 'mongoose';
import '../models/Category.js';
const Category = mongoose.models.Category || mongoose.model('Category');

const DEFAULT_CATEGORIES = [
    { name: 'Homestay', description: 'Stay with locals in a homely environment' },
    { name: 'Hotel', description: 'Book comfortable hotel rooms' },
    { name: 'Camping', description: 'Experience night under the stars' },
    { name: 'Trekking', description: 'Adventure trekking packages' },
    { name: 'Rafting', description: 'Thrilling river rafting experiences' },
    { name: 'Bungee Jumping', description: 'Adrenaline pumping jumps' },
    { name: 'Bike/Car Rental', description: 'Rent vehicles for your journey' },
    { name: 'Chardham Tour', description: 'Pilgrimage tour packages' }
];

export const seedCategories = async () => {
    const results = {
        added: 0,
        existing: 0,
        errors: []
    };

    for (const cat of DEFAULT_CATEGORIES) {
        try {
            const exists = await Category.findOne({ name: cat.name });
            if (!exists) {
                await Category.create(cat);
                results.added++;
            } else {
                results.existing++;
            }
        } catch (error) {
            results.errors.push({ name: cat.name, error: error.message });
        }
    }
    return results;
};
