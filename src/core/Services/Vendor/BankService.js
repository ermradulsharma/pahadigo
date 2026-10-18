import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES, HTTP_STATUS } from '@/core/Constants/index.js';
import Vendor from '@/core/Models/Vendor.js';
import RazorpayService from '@/core/Services/General/RazorpayService.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';
import { getBusinessByUserId } from '@/core/Helpers/queryHelpers.js';

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
        const vendor = await getBusinessByUserId(userId, '', { path: 'user' });
        if (!vendor) throw new AppError(RESPONSE_MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
        const updatePayload = { ...vendor.bankDetails };
        if (bankData.accountHolderName) updatePayload.accountHolderName = bankData.accountHolderName;
        if (bankData.accountNumber) updatePayload.accountNumber = bankData.accountNumber;
        if (bankData.ifscCode) updatePayload.ifscCode = bankData.ifscCode;
        if (bankData.bankName) updatePayload.bankName = bankData.bankName;

        // Create RazorpayX Contact and Fund Account if basic details exist
        if (updatePayload.accountHolderName && updatePayload.accountNumber && updatePayload.ifscCode) {
            const contactName = updatePayload.accountHolderName || vendor.ownerName || vendor.businessName;
            const contactPhone = vendor.businessNumber || vendor.personalNumber || vendor.user?.phone;
            const contactEmail = vendor.businessEmail || vendor.user?.email || `vendor_${vendor._id}@pahadigo.co.in`;

            if (!contactName || !contactPhone) {
                throw new AppError("Vendor owner name and contact number are required to register bank details.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
            }

            try {
                const contactData = {
                    name: contactName,
                    email: contactEmail,
                    contact: contactPhone,
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
                throw new AppError("Failed to register bank details with payment gateway: " + err.message, HTTP_STATUS.BAD_REQUEST);
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
