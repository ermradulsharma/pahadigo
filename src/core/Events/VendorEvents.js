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
 * Sends a profile update confirmation email and push notification to the vendor.
 */
VendorEvents.on('vendor.profile_updated', async ({ identifier, details }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendUserProfileUpdatedEmail(identifier, details);
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

/**
 * Asynchronously emit an event and wait for all registered listeners to complete.
 * Crucial for serverless environments (e.g. Vercel) where background promises are
 * frozen as soon as the HTTP response is dispatched.
 */
VendorEvents.emitAsync = async function (event, data) {
    const listeners = this.listeners(event);
    if (!listeners || listeners.length === 0) return [];
    return await Promise.all(listeners.map(fn => fn(data)));
};

export default VendorEvents;
