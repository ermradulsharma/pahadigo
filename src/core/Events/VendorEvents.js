import { EventEmitter } from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { NOTIFICATION } from '../Constants/notification';

const VendorEvents = new EventEmitter();

// ================================================================== //
//                                                                    //
//                   BUSINESS Events Emails                           //
//                                                                    //
// ================================================================== //
const registerEmailListener = (eventKey, handlerFn) => {
    VendorEvents.on(eventKey, async ({ identifier, details, businessName }) => {
        try {
            if (identifier && identifier.includes('@')) {
                await handlerFn(identifier, details || businessName);
            }
        } catch (error) {
            getLogger().error({ err: error }, `[VendorEvents] Error handling ${eventKey}`);
        }
    });
};

// Business Profile Emails
registerEmailListener(NOTIFICATION.KEY.BUSINESS.PROFILE_CREATED, (id, data) => NotificationService.sendBusinessWelcomeEmail(id, data));
registerEmailListener(NOTIFICATION.KEY.BUSINESS.PROFILE_UPDATED, (id, data) => NotificationService.sendBusinessProfileUpdateEmail(id, data));
registerEmailListener(NOTIFICATION.KEY.BUSINESS.PROFILE_ACTIVATED, (id, data) => NotificationService.sendBusinessProfileActivatedEmail(id, data));
registerEmailListener(NOTIFICATION.KEY.BUSINESS.PROFILE_DEACTIVATED, (id, data) => NotificationService.sendBusinessProfileDeactivatedEmail(id, data));
registerEmailListener(NOTIFICATION.KEY.BUSINESS.OPERATING_STATUS_UPDATED, (id, data) => NotificationService.sendBusinessOperationalStatusEmail(id, data));
registerEmailListener(NOTIFICATION.KEY.BUSINESS.PROFILE_DELETED, (id, data) => NotificationService.sendBusinessProfileDeletedEmail(id, data));

// Business Document Emails
registerEmailListener(NOTIFICATION.KEY.BUSINESS.DOCUMENT_UPLOADED, (id, data) => NotificationService.sendVendorDocumentsReceivedEmail(id, data));

// Business Bank Details Emails
registerEmailListener(NOTIFICATION.KEY.BUSINESS.BANK_DETAILS_ADDED, (id, data) => NotificationService.sendVendorBankAddedEmail(id, data));

VendorEvents.emitAsync = async function (event, data) {
    const listeners = this.listeners(event);
    if (!listeners || listeners.length === 0) return [];
    return await Promise.all(listeners.map(fn => fn(data)));
};

export default VendorEvents;
