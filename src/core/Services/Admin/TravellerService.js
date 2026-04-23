import User from '@/core/Models/User.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import AuditService from '@/core/Services/Admin/AuditService.js';

/**
 * TravellerService (Admin Role)
 * Administration of traveller accounts and consumer-facing users.
 */
class TravellerService {
  async getAllTravellers() {
    return await User.find({ role: 'traveller' }).sort({ createdAt: -1 }).select('-password').lean();
  }

  async createTraveller(data, req = null) {
    const { email, phone, name, password } = data;
    const exists = await User.findOne({ email });
    if (exists) throw new Error(RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS);

    const user = await User.create({
      email, phone, name, password,
      role: 'traveller', isVerified: true
    });

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'CREATE', 'USER', user._id, { email: user.email }, req);
    }
    return user;
  }

  async updateTraveller(id, data, req = null) {
    const user = await User.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'USER', id, { changes: data }, req);
    return user;
  }

  async deleteTraveller(id) {
    return await User.findByIdAndDelete(id);
  }
}

export default new TravellerService();
