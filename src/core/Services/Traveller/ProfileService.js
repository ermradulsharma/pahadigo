import User from '@/core/Models/User.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { toObjectId } from '@/core/Helpers/objectId.js';
import { findByIdLean } from '@/core/Helpers/queryHelpers.js';

class ProfileService {
    /**
     * Get traveller profile by ID
     * @param {string|import('mongoose').Types.ObjectId} userId
     * @returns {Promise<Object|null>}
     */
    async getProfile(userId) {
        const id = toObjectId(userId);
        if (!id) return null;
        return await findByIdLean(User, id, '-password');
    }

    /**
     * Update traveller profile details
     * @param {string|import('mongoose').Types.ObjectId} userId
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async updateProfile(userId, data = {}) {
        const id = toObjectId(userId);
        if (!id) throw new Error('Invalid user ID');

        const updateData = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.gender !== undefined) updateData.gender = data.gender;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
        if (data.medicalConditions !== undefined) updateData.medicalConditions = data.medicalConditions;

        // Map dob to dateOfBirth if provided
        if (data.dob !== undefined) {
            updateData.dateOfBirth = data.dob;
        } else if (data.dateOfBirth !== undefined) {
            updateData.dateOfBirth = data.dateOfBirth;
        }

        // Guard sensitive fields
        delete updateData.password;
        delete updateData.role;

        return await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { returnDocument: 'after' }
        ).select('-password');
    }

    /**
     * Upload and update avatar
     * @param {string|import('mongoose').Types.ObjectId} userId
     * @param {File|Object} avatarFile
     * @returns {Promise<Object>}
     */
    async updateAvatar(userId, avatarFile) {
        const id = toObjectId(userId);
        if (!id) throw new Error('Invalid user ID');

        const uploadRes = await uploadToCloudinary(avatarFile, `avatars/${id}`);
        const avatarUrl = uploadRes.url || uploadRes.secure_url;

        return await User.findByIdAndUpdate(
            id,
            { $set: { profileImage: avatarUrl } },
            { returnDocument: 'after' }
        ).select('-password');
    }
}

const profileService = new ProfileService();
export default profileService;

