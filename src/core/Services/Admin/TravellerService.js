import User from '@/core/Models/User.js';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '@/core/Constants/index.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import Wishlist from '@/core/Models/Wishlist.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';
import { getUserBy, getUsersBy, getBookingsBy, getManyBy, updateById, deleteById } from '@/core/Helpers/queryHelpers.js';

/**
 * TravellerService (Admin Role)
 * Administration of traveller accounts and consumer-facing users.
 */
class TravellerService {
  async getAllTravellers() {
    const cacheKey = 'admin:travellers:all';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const travellers = await getUsersBy({ role: 'traveller' }, '-password', null, { createdAt: -1 });
    await CacheService.set(cacheKey, travellers, 300);
    return travellers;
  }

  async getTravellerById(id) {
    const user = await getUserBy({ _id: id, role: 'traveller' }, '-password');
    if (!user) throw new AppError(RESPONSE_MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    
    const bookings = await getBookingsBy({ user: id }, '', null, { createdAt: -1 });
    const wishlists = await getManyBy(Wishlist, { user: id }, '', null, { createdAt: -1 });

    return { ...user, bookings, wishlists };
  }

  async createTraveller(data, req = null) {
    const { email, phone, name, password } = data;
    const exists = await getUserBy({ email });
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
    const user = await updateById(User, id, data, { returnDocument: 'after' });
    if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'USER', id, { changes: data }, req);
    await CacheService.delete('admin:travellers:all');
    return user;
  }

  async deleteTraveller(id) {
    const deleted = await deleteById(User, id);
    await CacheService.delete('admin:travellers:all');
    return deleted;
  }
}

export default new TravellerService();
