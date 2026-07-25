import { EventEmitter } from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';

const VendorEvents = new EventEmitter();

/**
 * Event: vendor.profile_created
 * Sends a welcome email to the vendor upon successful profile creation.
 */
VendorEvents.on('vendor.profile_created', async ({ identifier, businessName }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendVendorWelcomeEmail(identifier, businessName);
    } catch (error) {
        console.error("[VendorEvents] Error handling vendor.profile_created:", error);
    }
});

/**
 * Event: vendor.documents_uploaded
 * Sends an email to the vendor acknowledging receipt of verification documents.
 */
VendorEvents.on('vendor.documents_uploaded', async ({ identifier, businessName }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendVendorDocumentsReceivedEmail(identifier, businessName);
    } catch (error) {
        console.error("[VendorEvents] Error handling vendor.documents_uploaded:", error);
    }
});

/**
 * Event: vendor.bank_added
 * Sends an email to the vendor acknowledging receipt of their bank details.
 */
VendorEvents.on('vendor.bank_added', async ({ identifier, businessName }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendVendorBankAddedEmail(identifier, businessName);
    } catch (error) {
        console.error("[VendorEvents] Error handling vendor.bank_added:", error);
    }
});

export default VendorEvents;
