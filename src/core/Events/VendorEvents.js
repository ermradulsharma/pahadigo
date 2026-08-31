import { EventEmitter } from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';

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
        getLogger().error({ err: error }, "[VendorEvents] Error handling vendor.profile_created");
    }
});

/**
 * Event: vendor.profile_updated
 * Sends a profile update confirmation email to the vendor.
 */
VendorEvents.on('vendor.profile_updated', async ({ identifier, businessName }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendUserProfileUpdatedEmail(identifier, businessName);
    } catch (error) {
        getLogger().error({ err: error }, "[VendorEvents] Error handling vendor.profile_updated");
    }
});

/**
 * Event: vendor.profile_deleted
 * Sends email notification when vendor profile is soft-deleted.
 */
VendorEvents.on('vendor.profile_deleted', async ({ identifier, businessName }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendVendorProfileDeletedEmail(identifier, businessName);
    } catch (error) {
        getLogger().error({ err: error }, "[VendorEvents] Error handling vendor.profile_deleted");
    }
});

/**
 * Event: vendor.profile_operating_status_updated
 * Sends email notification when vendor operating status is updated.
 */
VendorEvents.on('vendor.profile_operating_status_updated', async ({ identifier, businessName, isOperating }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendVendorOperatingStatusUpdatedEmail(identifier, businessName, isOperating);
    } catch (error) {
        getLogger().error({ err: error }, "[VendorEvents] Error handling vendor.profile_operating_status_updated");
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
        getLogger().error({ err: error }, "[VendorEvents] Error handling vendor.documents_uploaded");
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
        getLogger().error({ err: error }, "[VendorEvents] Error handling vendor.bank_added");
    }
});

export default VendorEvents;
