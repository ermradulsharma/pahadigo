import ReviewController from '@/core/Controllers/Admin/ReviewController.js';
import DisputeController from '@/core/Controllers/Admin/DisputeController.js';
import InquiryController from '@/core/Controllers/Admin/InquiryController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/reviews' }, [
        { method: 'GET', path: '/', handler: wrap(() => ReviewController, 'getPendingReviews') },
        { method: 'PATCH', path: '/:id', schema: schemas.reviewModeration, handler: wrap(() => ReviewController, 'updateReviewStatus') },
        { method: 'DELETE', path: '/:id', schema: schemas.reviewModeration, handler: wrap(() => ReviewController, 'rejectReview') },
    ]),
    ...Router.group({ prefix: '/disputes' }, [
        { method: 'GET', path: '/', handler: wrap(() => DisputeController, 'getDisputes') },
        { method: 'PATCH', path: '/:id', schema: schemas.disputeResolution, handler: wrap(() => DisputeController, 'resolveDispute') },
        { method: 'GET', path: '/:id/messages', handler: wrap(() => DisputeController, 'getMessages') },
        { method: 'POST', path: '/:id/messages', schema: schemas.chatMessage, handler: wrap(() => DisputeController, 'sendMessage') },
    ]),
    ...Router.group({ prefix: '/inquiries' }, [
        { method: 'GET', path: '/', handler: wrap(() => InquiryController, 'getInquiries') },
        { method: 'PATCH', path: '/:id', schema: schemas.inquiryUpdate, handler: wrap(() => InquiryController, 'updateInquiry') },
        { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => InquiryController, 'deleteInquiry') },
    ]),
];
