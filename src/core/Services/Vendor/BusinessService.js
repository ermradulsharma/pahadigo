import Vendor from '@/models/Vendor.js';
import Category from '@/models/Category.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';
import User from '@/models/User.js';
import Review from '@/models/Review.js';
import Booking from '@/models/Booking.js';
import Dispute from '@/models/Dispute.js';
import Package from '@/models/Package.js';
import VendorClosure from '@/models/VendorClosure.js';
import { STATUS } from '@/constants/index.js';

class BusinessService {
  // Constructor
  constructor() {
    this.activeStatus = STATUS.ACTIVE;
  }

  // Sync Business Profile (Handles Update/Create)
  async syncBusinessProfile(userId, profileData) {
    const updateData = { ...profileData };
    if (profileData.documents) {
      delete updateData.documents;
      for (const key in profileData.documents) {
        if (profileData.documents[key] !== undefined) {
          updateData[`documents.${key}`] = profileData.documents[key];
        }
      }
    }
    if (profileData.bankDetails) {
      delete updateData.bankDetails;
      for (const key in profileData.bankDetails) {
        if (profileData.bankDetails[key] !== undefined) {
          updateData[`bankDetails.${key}`] = profileData.bankDetails[key];
        }
      }
    }
    if (profileData.businessCategory && Array.isArray(profileData.businessCategory)) {
      const categories = await Category.find({ slug: { $in: profileData.businessCategory } });
      updateData.category = categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug
      }));
      delete updateData.businessCategory;
    }
    if (updateData.address) {
      mapToGeoJSON(updateData.address, 'location');
    }

    const vendor = await Vendor.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        ...updateData,
        deletedAt: null,
        deletedBy: null
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    await User.findByIdAndUpdate(userId, { vendorProfile: vendor._id, name: vendor.ownerName });
    return await vendor.populate('user', 'email phone role');
  }

  // Fetch Business Record by User ID
  async getBusinessByUserId(userId) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null }).populate('user', 'email phone role');
    if (vendor) {
      const closures = await VendorClosure.find({ vendor: vendor._id, isActive: true }).sort({ startDate: 1 });
      vendor._doc.closurePeriods = closures;
    }
    return vendor;
  }

  // Retrieve Business Identity
  async getBusinessProfile(userId) {
    return await this.getBusinessByUserId(userId);
  }

  // Soft Delete Business Profile
  async removeBusinessProfile(userId, deletedBy) {
    return await Vendor.findOneAndUpdate(
      { user: userId, deletedAt: null },
      {
        deletedAt: new Date(),
        deletedBy: deletedBy
      },
      { returnDocument: 'after' }
    );
  }

  // Logic to evaluate and update the trust badge based on performance
  async calculateTrustBadge(vendorId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return null;

    let newBadge = 'none';

    // Base criteria for "verified": Must be approved and documents verified
    const isAadharVerified = vendor.documents?.aadharCard?.[0]?.status === 'verified';
    const isPanVerified = vendor.documents?.panCard?.status === 'verified';
    // For business profile type, registration must also be verified
    let isBusinessRegistrationVerified = true;
    if (vendor.profileType === 'business') {
      isBusinessRegistrationVerified = vendor.documents?.businessRegistration?.status === 'verified';
    }

    const isVerified = vendor.status === this.activeStatus && isAadharVerified && isPanVerified && isBusinessRegistrationVerified;

    if (isVerified) {
      newBadge = 'verified';

      // Now evaluate for "super_partner"
      // [BUGFIX] Searching by business ID (Vendor ID) instead of User ID
      const catalog = await Package.findOne({ business: vendorId });

      if (catalog) {
        const totalBookings = await Booking.countDocuments({ package: catalog._id, status: 'completed' });

        if (totalBookings >= 10) {
          const disputeCount = await Dispute.countDocuments({ vendorId: vendorId, status: 'resolved_refunded' });
          const disputeRate = disputeCount / totalBookings;

          const reviewStats = await Review.aggregate([
            { $match: { vendor: vendor._id } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
          ]);

          const avgRating = reviewStats.length > 0 ? reviewStats[0].avgRating : 0;

          if (avgRating >= 4.5 && disputeRate <= 0.05) {
            newBadge = 'super_partner';
          }
        }
      }
    }

    if (vendor.trustBadge !== newBadge) {
      vendor.trustBadge = newBadge;
      await vendor.save();
    }

    return newBadge;
  }

  // Update Verification/Moderation Status
  async updateBusinessStatus(userId, status) {
    return await Vendor.findOneAndUpdate(
      { user: userId, deletedAt: null },
      { status: status },
      { returnDocument: 'after' }
    );
  }

  // Toggle Operational/Availability status
  async toggleOperatingStatus(userId, isOperating) {
    return await Vendor.findOneAndUpdate(
      { user: userId, deletedAt: null },
      { isOperating: isOperating },
      { returnDocument: 'after' }
    );
  }
}

export default new BusinessService();
