import Package from '@/core/Models/Package.js';
import User from '@/core/Models/User.js';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '@/core/Constants/index.js';
import AppError from '@/core/Helpers/AppError.js';
import CacheService from '@/core/Services/CacheService.js';
import mongoose from 'mongoose';

/**
 * PackageService (Admin Role)
 * Platform-wide catalog management, service overrides, and inventory inspection.
 */
class PackageService {

    async invalidatePackageCaches(vendorId = null, serviceId = null) {
        await CacheService.del('admin:packages:all');
        if (vendorId) await CacheService.del(`admin:packages:vendor:${vendorId}`);
        if (serviceId) await CacheService.del(`admin:packages:item:${serviceId}`);
    }

    async getAllServices() {
        const cacheKey = 'admin:packages:all';
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const packages = await Package.find()
            .populate('vendor', 'name email businessName ownerName phone')
            .lean();

        const services = [];
        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        
        if (packages && Array.isArray(packages)) {
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
        }

        await CacheService.set(cacheKey, services, 1800); // 30 mins
        return services;
    }

    async toggleServiceStatus(serviceId, status, serviceType, vendorId, userId) {
        const session = await mongoose.startSession();
        let updatedItem = null;

        await session.withTransaction(async () => {
            let pkg;
            const query = {};
            if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
                query.vendor = new mongoose.Types.ObjectId(String(vendorId));
            }
            if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                query.user = new mongoose.Types.ObjectId(String(userId));
            }

            if (Object.keys(query).length > 0) {
                pkg = await Package.findOne(query).session(session);
            }

            if (!pkg && serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
                const oid = new mongoose.Types.ObjectId(String(serviceId));
                const categoryFields = Object.keys(Package.schema.paths)
                    .filter(p => !p.includes('.') && Array.isArray(Package.schema.paths[p].options.type));
                pkg = await Package.findOne({
                    $or: categoryFields.map(key => ({ [`${key}._id`]: oid }))
                }).session(session);
            }

            if (!pkg) throw new AppError(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

            const list = pkg[serviceType];
            if (!list) throw new AppError(`Invalid service type: ${serviceType}`, HTTP_STATUS.BAD_REQUEST);

            const idx = list.findIndex(s => s._id.toString() === serviceId);
            if (idx === -1) throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

            pkg[serviceType][idx].isActive = status;
            pkg.markModified(serviceType);
            await pkg.save({ session });
            
            updatedItem = pkg[serviceType][idx];
        });

        session.endSession();
        await this.invalidatePackageCaches(vendorId, serviceId);
        return updatedItem;
    }

    async getPackageItem(itemId) {
        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }

        const cacheKey = `admin:packages:item:${itemId}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const oid = new mongoose.Types.ObjectId(String(itemId));
        const categoryFields = Object.keys(Package.schema.paths)
            .filter(p => !p.includes('.') && Array.isArray(Package.schema.paths[p].options.type));

        const pkg = await Package.findOne({
            $or: categoryFields.map(key => ({ [`${key}._id`]: oid }))
        }).populate('vendor', 'name email').lean();

        if (!pkg) throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        for (const key of Object.keys(pkg)) {
            if (EXCLUDED_KEYS.includes(key)) continue;
            const list = pkg[key];
            if (Array.isArray(list)) {
                const item = list.find(it => it._id?.toString() === String(itemId));
                if (item) {
                    const result = { ...item, serviceType: key, vendor: pkg.vendor };
                    await CacheService.set(cacheKey, result, 1800);
                    return result;
                }
            }
        }
        
        throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    async updatePackageItem(itemId, data) {
        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        }

        const session = await mongoose.startSession();
        let updatedItem = null;

        await session.withTransaction(async () => {
            const oid = new mongoose.Types.ObjectId(String(itemId));
            const categoryFields = Object.keys(Package.schema.paths)
                .filter(p => !p.includes('.') && Array.isArray(Package.schema.paths[p].options.type));

            const pkg = await Package.findOne({
                $or: categoryFields.map(key => ({ [`${key}._id`]: oid }))
            }).session(session);

            if (!pkg) throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

            const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
            for (const key of Object.keys(pkg.toObject())) {
                if (EXCLUDED_KEYS.includes(key)) continue;
                const item = pkg[key]?.id(oid);
                if (item) {
                    Object.assign(item, data);
                    pkg.markModified(key);
                    await pkg.save({ session });
                    updatedItem = item;
                    break;
                }
            }
            
            if (!updatedItem) throw new AppError(RESPONSE_MESSAGES.ITEM.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        });

        session.endSession();
        await this.invalidatePackageCaches(null, itemId);
        return updatedItem;
    }

    async createPackage(vendorId, data) {
        const session = await mongoose.startSession();
        let result = null;

        await session.withTransaction(async () => {
            let pkg = await Package.findOne({ vendor: vendorId }).session(session);
            if (!pkg) {
                pkg = await Package.create([{ vendor: vendorId }], { session });
                result = pkg[0];
            } else {
                result = pkg;
            }
        });

        session.endSession();
        await this.invalidatePackageCaches(vendorId);
        return result;
    }

    async deletePackage(id) {
        const session = await mongoose.startSession();
        let deleted = null;
        
        await session.withTransaction(async () => {
            deleted = await Package.findByIdAndDelete(id).session(session);
        });
        
        session.endSession();
        if (deleted) await this.invalidatePackageCaches(deleted.vendor);
        return deleted;
    }

    async getVendorPackages(vendorId) {
        const cacheKey = `admin:packages:vendor:${vendorId}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const packages = await Package.find({
            $or: [{ vendor: vendorId }, { business: vendorId }]
        }).populate('vendor', 'name email').lean();

        const services = [];
        const EXCLUDED_KEYS = ['_id', 'vendor', 'business', 'createdAt', 'updatedAt', '__v'];
        
        if (packages) {
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
        }
        
        await CacheService.set(cacheKey, services, 1800);
        return services;
    }
}

export default new PackageService();
