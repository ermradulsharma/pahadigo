import * as CatModule from '../models/Category.js';
const Category = CatModule.default;

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

    console.log('Starting Category Seed...');
    console.log('CatModule:', CatModule);
    console.log('Category Model resolved:', Category);

    for (const cat of DEFAULT_CATEGORIES) {
        try {
            // Check if exists by name (case insensitive matching handled by regex or just check)
            // Since schema has unique on name, we can try to findOne first.
            const exists = await Category.findOne({ name: cat.name });

            if (!exists) {
                await Category.create(cat);
                results.added++;
            } else {
                results.existing++;
            }
        } catch (error) {
            console.error(`Error seeding category ${cat.name}:`, error);
            results.errors.push({ name: cat.name, error: error.message });
        }
    }

    console.log('Category Seed Complete:', results);
    return results;
};
