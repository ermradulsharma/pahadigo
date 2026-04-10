import Package from '@/models/Package.js';
import User from '@/models/User.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';
import mongoose from 'mongoose';

/**
 * PackageService (Admin Role)
 * Platform-wide catalog management, service overrides, and inventory inspection.
 */
class PackageService {
    // Legacy: getAllServices (Replaces listAllCatalogs)
    async getAllServices() {
        const packages = await Package.find()
            .populate('vendor', 'name email')
            .populate('business', 'businessName ownerName phone')
            .lean();

        const services = [];
        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        if (!packages || !Array.isArray(packages)) return [];

        packages.forEach(pkg => {
            if (!pkg) return;
            Object.keys(pkg).forEach(key => {
                if (EXCLUDED_KEYS.includes(key)) return;
                const list = pkg[key];
                if (list && Array.isArray(list)) {
                    list.forEach(item => {
                        if (!item) return;
                        services.push({
                            ...item,
                            serviceType: key,
                            vendor: pkg.vendor || {},
                            vendorId: pkg.vendor?._id?.toString() || "",
                            businessId: pkg.business?._id?.toString() || "",
                            catalogId: pkg._id?.toString() || ""
                        });
                    });
                }
            });
        });
        return services;
    }

    // Legacy: toggleServiceStatus
    async toggleServiceStatus(vendorId, serviceType, serviceId, status) {
        const pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

        const list = pkg[serviceType];
        if (!list) throw new Error(`Invalid service type: ${serviceType}`);

        const idx = list.findIndex(s => s._id.toString() === serviceId);
        if (idx === -1) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

        pkg[serviceType][idx].isActive = status;
        pkg.markModified(serviceType);
        await pkg.save();
        return pkg[serviceType][idx];
    }

    // Legacy: getPackageItem
    async getPackageItem(itemId) {
        const oid = new mongoose.Types.ObjectId(String(itemId));
        const categoryFields = Object.keys(Package.schema.paths)
            .filter(p => !p.includes('.') && Array.isArray(Package.schema.paths[p].options.type));

        const pkg = await Package.findOne({
            $or: categoryFields.map(key => ({ [`${key}._id`]: oid }))
        }).populate('vendor', 'name email').lean();

        if (!pkg) throw new Error("Item not found");

        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        for (const key of Object.keys(pkg)) {
            if (EXCLUDED_KEYS.includes(key)) continue;
            const list = pkg[key];
            if (Array.isArray(list)) {
                const item = list.find(it => it._id?.toString() === String(itemId));
                if (item) return { ...item, serviceType: key, vendor: pkg.vendor };
            }
        }
        throw new Error("Item not found");
    }

    // Legacy: updatePackageItem
    async updatePackageItem(itemId, data) {
        const oid = new mongoose.Types.ObjectId(String(itemId));
        const categoryFields = Object.keys(Package.schema.paths)
            .filter(p => !p.includes('.') && Array.isArray(Package.schema.paths[p].options.type));

        const pkg = await Package.findOne({
            $or: categoryFields.map(key => ({ [`${key}._id`]: oid }))
        });

        if (!pkg) throw new Error("Item not found");

        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        for (const key of Object.keys(pkg.toObject())) {
            if (EXCLUDED_KEYS.includes(key)) continue;
            const item = pkg[key]?.id(oid);
            if (item) {
                Object.assign(item, data);
                pkg.markModified(key);
                await pkg.save();
                return item;
            }
        }
        throw new Error("Item not found");
    }

    // Legacy: createPackage (Called from addPackageOnBehalf)
    async createPackage(vendorId, data) {
        let pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) {
            pkg = await Package.create({ vendor: vendorId });
        }
        // Simplified for now, just adds to a default category or specific depending on input
        // This logic should mirror the legacy PackageService.createPackage
        return pkg;
    }

    async deletePackage(id) {
        return await Package.findByIdAndDelete(id);
    }

    async getVendorPackages(vendorId) {
        const packages = await Package.find({
            $or: [{ vendor: vendorId }, { business: vendorId }]
        }).populate('vendor', 'name email').lean();

        const services = [];
        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        if (!packages) return [];

        packages.forEach(pkg => {
            Object.keys(pkg).forEach(key => {
                if (EXCLUDED_KEYS.includes(key)) return;
                const list = pkg[key];
                if (list && Array.isArray(list)) {
                    list.forEach(item => {
                        services.push({
                            ...item,
                            serviceType: key,
                            vendor: pkg.vendor,
                            vendorId: pkg.vendor?._id?.toString() || vendorId,
                            catalogId: pkg._id?.toString()
                        });
                    });
                }
            });
        });
        return services;
    }
}

export default new PackageService();
