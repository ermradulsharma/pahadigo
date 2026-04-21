import User from '@/models/User.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * ProfileService (Traveller Role)
 * Handles traveller-facing profile management, preferences, and avatar updates.
 */
class ProfileService {
    async getProfile(userId) {
        return await User.findById(userId).select('-password');
    }

    async updateProfile(userId, data) {
        const allowedFields = ['name', 'phone', 'address', 'preferences'];
        const updates = {};
        
        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) updates[key] = data[key];
        });

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
            { $set: { avatar: result.url } }, 
            { returnDocument: 'after' }
        ).select('-password');
    }
}

export default new ProfileService();
