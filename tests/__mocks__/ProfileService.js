import User from '@/core/Models/User.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';

class ProfileService {
    async getProfile(userId) {
        return await User.findById(userId).select('-password').lean();
    }

    async updateProfile(userId, data) {
        const allowed = ['name', 'phone', 'gender', 'bio'];
        const updateData = {};
        Object.keys(data).forEach(k => {
            if (allowed.includes(k)) updateData[k] = data[k];
        });
        if (data.dob) updateData.dateOfBirth = new Date(data.dob);

        const updated = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).lean();
        if (updated) delete updated.password;
        return updated;
    }

    async updateAvatar(userId, file) {
        const uploaded = await uploadToCloudinary(file, `avatars/${userId}`);
        const updated = await User.findByIdAndUpdate(userId, { $set: { profileImage: uploaded.url } }, { new: true }).lean();
        return updated;
    }
}

export default new ProfileService();
