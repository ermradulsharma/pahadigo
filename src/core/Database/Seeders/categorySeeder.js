import Category from '@/core/Models/Category.js';
import { DEFAULTS } from '@/core/Constants/index.js';
import { CATEGORY_TITLES, CATEGORY_SLUGS } from '@/core/Constants/categories.js';

const DEFAULT_CATEGORIES = [
    { name: CATEGORY_TITLES.HOMESTAY, slug: CATEGORY_SLUGS.HOMESTAY, description: 'Stay with locals in a homely environment', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.HOTEL, slug: CATEGORY_SLUGS.HOTEL, description: 'Book comfortable hotel rooms', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.CAMPING, slug: CATEGORY_SLUGS.CAMPING, description: 'Experience night under the stars', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.TREKKING, slug: CATEGORY_SLUGS.TREKKING, description: 'Adventure trekking packages', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.RAFTING, slug: CATEGORY_SLUGS.RAFTING, description: 'Thrilling river rafting experiences', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.BUNGEE_JUMPING, slug: CATEGORY_SLUGS.BUNGEE_JUMPING, description: 'Adrenaline pumping jumps', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.BIKE_SCOOTER_RENTAL, slug: CATEGORY_SLUGS.BIKE_SCOOTER_RENTAL, description: 'Rent vehicles for your journey', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.CHARDHAM_TOUR, slug: CATEGORY_SLUGS.CHARDHAM_TOUR, description: 'Pilgrimage tour packages', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.CUSTOM_TRIP, slug: CATEGORY_SLUGS.CUSTOM_TRIP, description: 'Create your own trip', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.SKIING, slug: CATEGORY_SLUGS.SKIING, description: 'Thrilling skiing adventures', isActive: DEFAULTS.TRUE },
    { name: CATEGORY_TITLES.PARAGLIDING, slug: CATEGORY_SLUGS.PARAGLIDING, description: 'Fly high with paragliding', isActive: DEFAULTS.TRUE }
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

export default seedCategories;
