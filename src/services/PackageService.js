const Package = require('../models/Package');
const Vendor = require('../models/Vendor');

class PackageService {
    async createPackage(vendorId, packageData) {
        const pkg = await Package.create({
            vendor: vendorId,
            ...packageData
        });
        return pkg;
    }

    async getAvailablePackages() {
        // Only from approved vendors
        const activeVendors = await Vendor.find({ isApproved: true }).select('_id');
        const vendorIds = activeVendors.map(v => v._id);

        const packages = await Package.find({ vendor: { $in: vendorIds } })
            .populate('vendor', 'businessName category');

        return packages;
    }

    async getPackageById(packageId) {
        return await Package.findById(packageId);
    }
}

module.exports = new PackageService();
