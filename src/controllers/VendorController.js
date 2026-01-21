const VendorService = require('../services/VendorService');
const PackageService = require('../services/PackageService');

class VendorController {

  // POST /vendor/profile (Create or Update)
  async updateProfile(req) {
    try {
      const user = req.user;
      if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

      const body = await req.json();
      const { businessName, category } = body;

      if (!businessName || !category) {
        return { status: 400, data: { error: 'Business name and category are required' } };
      }

      const vendor = await VendorService.upsertProfile(user.id, body);

      return { status: 200, data: { message: 'Profile updated', vendor } };
    } catch (error) {
      console.error('Update Profile Error:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  // POST /vendor/create-package
  async createPackage(req) {
    try {
      const user = req.user;
      if (!user || user.role !== 'vendor') {
        return { status: 403, data: { error: 'Access denied. Vendors only.' } };
      }

      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) {
        return { status: 400, data: { error: 'Vendor profile not completed' } };
      }

      const body = await req.json();
      const { title, price } = body;

      if (!title || !price) {
        return { status: 400, data: { error: 'Package title and price are required' } };
      }

      const newPackage = await PackageService.createPackage(vendor._id, body);

      return { status: 201, data: { message: 'Package created', package: newPackage } };
    } catch (error) {
      console.error('Create Package Error:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  // GET /vendor/categories
  async getCategories(req) {
    const categories = VendorService.getCategories();
    return { status: 200, data: { categories } };
  }
}

module.exports = new VendorController();
