import Controller from '@/core/Http/Controllers/Controller.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import { getLogger } from '@/core/Lib/logger.js';

/**
 * QStashWebhookController - Handles background queue processing requests from Upstash QStash.
 */
class QStashWebhookController extends Controller {

  /**
   * Process QStash job execution
   */
  async processJob(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();

      if (!body || !body.type || !body.payload) {
        return this.error(HTTP_STATUS.BAD_REQUEST, 'Invalid QStash payload format');
      }

      const { type, payload } = body;
      getLogger().info({ type, requestId: req.requestId }, `[QStash Webhook] Processing job type: ${type}`);

      if (type === 'generate_invoice') {
        const { email, bookingId, role } = payload;
        const success = await NotificationService._processInvoiceDelivery(email, bookingId, role);
        if (!success) {
          return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to deliver invoice');
        }
        return this.success(HTTP_STATUS.OK, 'Invoice delivered successfully', { bookingId });

      } else if (type === 'send_push_notification') {
        const { token, notification, data } = payload;
        const result = await PushNotificationService.sendToDevice(token, notification, data);

        if (!result.success) {
          return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, result.error || 'Push Notification Failed');
        }
        return this.success(HTTP_STATUS.OK, 'Push notification sent', { messageId: result.messageId });

      } else if (type === 'process_ocr') {
        const { default: OCRService } = await import('@/core/Services/Admin/OCRService.js');
        const { default: Vendor } = await import('@/core/Models/Vendor.js');
        const { vendorId, docType, imageBufferBase64 } = payload;

        const buffer = Buffer.from(imageBufferBase64, 'base64');
        const ocrResult = await OCRService.processDocument(buffer);

        await Vendor.findByIdAndUpdate(vendorId, {
          $set: {
            [`documents.${docType}.ocrData`]: {
              identifiedId: ocrResult.identifiedId,
              text: ocrResult.text
            }
          }
        });

        return this.success(HTTP_STATUS.OK, 'OCR document processing complete', { vendorId, ocrResult });

      } else {
        getLogger().warn({ type }, `[QStash Webhook] Unknown job type received: ${type}`);
        return this.error(HTTP_STATUS.BAD_REQUEST, `Unknown job type: ${type}`);
      }

    } catch (error) {
      getLogger().error({ err: error, requestId: req.requestId }, '[QStash Webhook] Processing Error');
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error processing background job');
    }
  }
}

export default new QStashWebhookController();
