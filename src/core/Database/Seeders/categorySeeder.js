import mongoose from 'mongoose';
import '../../Models/Category.js';
const Category = mongoose.models.Category || mongoose.model('Category');

const DEFAULT_CATEGORIES = [
  { name: 'Homestay', description: 'Stay with locals in a homely environment', isActive: true },
  { name: 'Hotel', description: 'Book comfortable hotel rooms', isActive: true },
  { name: 'Camping', description: 'Experience night under the stars', isActive: true },
  { name: 'Trekking', description: 'Adventure trekking packages', isActive: true },
  { name: 'Rafting', description: 'Thrilling river rafting experiences', isActive: true },
  { name: 'Bungee Jumping', description: 'Adrenaline pumping jumps', isActive: true },
  { name: 'Bike/Scooter Rental', description: 'Rent vehicles for your journey', isActive: true },
  { name: 'Chardham Tour', description: 'Pilgrimage tour packages', isActive: true },
  { name: 'Custom Trip', description: 'Create your own trip', isActive: true }
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
