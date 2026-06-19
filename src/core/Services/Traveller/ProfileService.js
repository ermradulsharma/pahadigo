import User from '@/core/Models/User.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';

/**
 * ProfileService (Traveller Role)
 * Handles traveller-facing profile management, preferences, and avatar updates.
 */
class ProfileService {
  async getProfile(userId) {
    return await User.findById(userId).select('-password');
  }

  async updateProfile(userId, data) {
    const allowedFields = [
      'name', 'phone', 'address', 'preferences',
      'gender', 'dateOfBirth', 'dob', 'bio',
      'bloodGroup', 'medicalConditions', 'profileImage', 'avatar'
    ];
    const updates = {};

    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'dob') {
          updates['dateOfBirth'] = data[key];
        } else if (key === 'avatar') {
          updates['profileImage'] = data[key];
        } else {
          updates[key] = data[key];
        }
      }
    });

    if (updates.address) {
      mapToGeoJSON(updates.address, 'location');
    }

    return await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { returnDocument: 'after' }
    ).select('-password');
  }

  async updateAvatar(userId, avatarFile) {
    if (!avatarFile) throw new Error(RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

    const result = await uploadToCloudinary(avatarFile, `avatars/${userId}`);

    return await User.findByIdAndUpdate(
      userId,
      { $set: { profileImage: result.url } },
      { returnDocument: 'after' }
    ).select('-password');
  }
}

export default new ProfileService();
