import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Vendor from '@/core/Models/Vendor.js';
import RazorpayService from '@/core/Services/General/RazorpayService.js';
import CacheService from '@/core/Services/CacheService.js';

class BankService {
    async invalidateVendorCaches(userId, vendorId = null) {
        await CacheService.del('admin:vendors:all');
        await CacheService.del('admin:dashboard:stats');
        if (userId) {
            await CacheService.del(`admin:vendors:${userId}`);
            await CacheService.del(`user:profile:${userId}`);
        }
        if (vendorId) {
            await CacheService.del(`admin:vendors:${vendorId}`);
        }
    }

    // Update Bank Details
    // Synchronize and update payout credentials
    async updateBankDetails(userId, bankData) {
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null }).populate('user').lean();
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        const updatePayload = { ...vendor.bankDetails };
        if (bankData.accountHolderName) updatePayload.accountHolderName = bankData.accountHolderName;
        if (bankData.accountNumber) updatePayload.accountNumber = bankData.accountNumber;
        if (bankData.ifscCode) updatePayload.ifscCode = bankData.ifscCode;
        if (bankData.bankName) updatePayload.bankName = bankData.bankName;

        // Create RazorpayX Contact and Fund Account if basic details exist
        if (updatePayload.accountHolderName && updatePayload.accountNumber && updatePayload.ifscCode) {
            try {
                const contactData = {
                    name: updatePayload.accountHolderName || vendor.ownerName || 'Vendor',
                    email: vendor.user?.email || `vendor_${vendor._id}@pahadigo.co.in`,
                    contact: vendor.businessNumber || vendor.personalNumber || '9999999999',
                    type: 'vendor',
                    reference_id: vendor._id.toString()
                };
                const contact = await RazorpayService.createContact(contactData);
                updatePayload.razorpayContactId = contact.id;

                const fundAccountData = {
                    contact_id: contact.id,
                    account_type: 'bank_account',
                    bank_account: {
                        name: updatePayload.accountHolderName,
                        ifsc: updatePayload.ifscCode,
                        account_number: updatePayload.accountNumber
                    }
                };
                const fundAccount = await RazorpayService.createFundAccount(fundAccountData);
                updatePayload.razorpayFundAccountId = fundAccount.id;
            } catch (err) {
                throw new Error("Failed to register bank details with payment gateway: " + err.message);
            }
        }

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
        await this.invalidateVendorCaches(userId, vendor._id);
        return updatedVendor.bankDetails;
    }

    // Delete Bank Details
    // Remove financial credentials from profile
    async deleteBankDetails(userId) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $unset: { bankDetails: "" } },
            { returnDocument: 'after' }
        ).populate('user', 'email phone role');
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor;
    }

    // --- INDUSTRY STANDARD ALIASES ---
    async syncBankDetails(...args) { return this.updateBankDetails(...args); }
    async removeBankDetails(...args) { return this.deleteBankDetails(...args); }
}

export default new BankService();
