import User from '@/core/Models/User.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import Booking from '@/core/Models/Booking.js';
import Wishlist from '@/core/Models/Wishlist.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';
import mongoose from 'mongoose';

/**
 * TravellerService (Admin Role)
 * Administration of traveller accounts and consumer-facing users.
 */
class TravellerService {
  async getAllTravellers() {
    const cacheKey = 'admin:travellers:all';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const travellers = await User.find({ role: 'traveller' }).sort({ createdAt: -1 }).select('-password').lean();
    await CacheService.set(cacheKey, travellers, 300);
    return travellers;
  }

  async getTravellerById(id) {
    const user = await User.findOne({ _id: id, role: 'traveller' }).select('-password').lean();
    if (!user) throw new AppError(RESPONSE_MESSAGES.ERROR.NOT_FOUND, 404);
    
    const bookings = await Booking.find({ user: id }).sort({ createdAt: -1 }).lean();
    const wishlists = await Wishlist.find({ user: id }).sort({ createdAt: -1 }).lean();

    return { ...user, bookings, wishlists };
  }

  async createTraveller(data, req = null) {
    const { email, phone, name, password } = data;
    const exists = await User.findOne({ email }).lean();
    if (exists) throw new AppError(RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS, 400);

    const user = await User.create({
      email, phone, name, password,
      role: 'traveller', isVerified: true
    });

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'CREATE', 'USER', user._id, { email: user.email }, req);
    }
    await CacheService.delete('admin:travellers:all');
    return user;
  }

  async updateTraveller(id, data, req = null) {
    if (data.address) {
      mapToGeoJSON(data.address, 'location');
    }
    const user = await User.findByIdAndUpdate(id, data, { new: true, lean: true });
    if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'USER', id, { changes: data }, req);
    await CacheService.delete('admin:travellers:all');
    return user;
  }

  async deleteTraveller(id) {
    const deleted = await User.findByIdAndDelete(id);
    await CacheService.delete('admin:travellers:all');
    return deleted;
  }
}

export default new TravellerService();
