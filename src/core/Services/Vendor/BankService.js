import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Vendor from '@/core/Models/Vendor.js';

class BankService {
  // Update Bank Details
  // Synchronize and update payout credentials
  async updateBankDetails(userId, bankData) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
    const updatePayload = { ...vendor.bankDetails };
    if (bankData.accountHolderName) updatePayload.accountHolderName = bankData.accountHolderName;
    if (bankData.accountNumber) updatePayload.accountNumber = bankData.accountNumber;
    if (bankData.ifscCode) updatePayload.ifscCode = bankData.ifscCode;
    if (bankData.bankName) updatePayload.bankName = bankData.bankName;
    const fileUpload = bankData.cancelledChequeFile || (bankData.cancelledCheque && typeof bankData.cancelledCheque === 'object' && bankData.cancelledCheque.size ? bankData.cancelledCheque : null);
    if (fileUpload) {
      const res = await uploadToCloudinary(fileUpload, `vendor_bank/${userId}`);
      updatePayload.cancelledCheque = {
        url: res.url,
        publicId: res.publicId,
        status: 'pending'
      };
    }
    const updatedVendor = await Vendor.findOneAndUpdate(
      { _id: vendor._id },
      { $set: { bankDetails: updatePayload } },
      { returnDocument: 'after' }
    );
    return updatedVendor.bankDetails;
  }

  // Delete Bank Details
  // Remove financial credentials from profile
  async deleteBankDetails(userId) {
    return await Vendor.findOneAndUpdate(
      { user: userId, deletedAt: null },
      { $unset: { bankDetails: "" } },
      { returnDocument: 'after' }
    ).populate('user', 'email phone role');
  }

  // --- INDUSTRY STANDARD ALIASES ---
  async syncBankDetails(...args) { return this.updateBankDetails(...args); }
  async removeBankDetails(...args) { return this.deleteBankDetails(...args); }
}

export default new BankService();
