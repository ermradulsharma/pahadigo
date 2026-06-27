import Package from '@/core/Models/Package.js';
import User from '@/core/Models/User.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import mongoose from 'mongoose';

/**
 * PackageService (Admin Role)
 * Platform-wide catalog management, service overrides, and inventory inspection.
 */
class PackageService {
    async getAllServices() {
        const packages = await Package.find().populate('vendor', 'name email').populate('vendor', 'businessName ownerName phone').lean();

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

    async toggleServiceStatus(serviceId, status, serviceType, vendorId, userId) {
        let pkg;

        // 1. Try finding by vendorId or userId if they are valid ObjectIds
        const query = {};
        if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
            query.vendor = new mongoose.Types.ObjectId(String(vendorId));
        }
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query.user = new mongoose.Types.ObjectId(String(userId));
        }

        if (Object.keys(query).length > 0) {
            pkg = await Package.findOne(query);
        }

        // 2. Fallback: If not found by vendor/user, try finding by serviceId subdocument
        if (!pkg && serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
            const oid = new mongoose.Types.ObjectId(String(serviceId));
            const categoryFields = Object.keys(Package.schema.paths)
                .filter(p => !p.includes('.') && Array.isArray(Package.schema.paths[p].options.type));
            pkg = await Package.findOne({
                $or: categoryFields.map(key => ({ [`${key}._id`]: oid }))
            });
        }

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

    async getPackageItem(itemId) {
        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            throw new Error("Item not found");
        }
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
        throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);
    }

    async updatePackageItem(itemId, data) {
        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            throw new Error("Item not found");
        }
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
        throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);
    }

    async createPackage(vendorId, data) {
        let pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) {
            pkg = await Package.create({ vendor: vendorId });
        }
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
