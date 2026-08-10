import { z } from 'zod';
import { RESPONSE_MESSAGES, USER_ROLES, DEFAULTS } from '@/core/Constants/index.js';

/**
 * Common validation schemas for the Pahadigo platform.
 */
const optionalString = (max = 500) => z.string().trim().max(max).optional().nullable();
const idString = z.string().trim().min(1, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
const flexibleObject = z.object({}).passthrough();
const moderationStatus = z.enum(['active', 'inactive', 'pending', 'approved', 'verified', 'rejected', 'suspended', 'blocked']);
const bookingStatus = z.enum(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'refunded']);

export const schemas = {
    // Auth Schemas
    passwordLogin: z.object({
        email: z.string().email(RESPONSE_MESSAGES.VALIDATION.INVALID_EMAIL),
        password: z.string().min(6, RESPONSE_MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH),
        rememberMe: z.boolean().optional()
    }),

    otpSend: z.object({
        email: z.string().email(RESPONSE_MESSAGES.VALIDATION.INVALID_EMAIL).optional(),
        phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional(),
        termsAccepted: z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional()
    }).refine(data => data.email || data.phone, {
        message: RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED,
        path: ['email'] // attach error to email field
    }),

    otpLogin: z.object({
        identifier: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        otp: z.string().min(4, RESPONSE_MESSAGES.VALIDATION.OTP_MIN_LENGTH),
        targetRole: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional(),
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional()
    }).refine(data => data.identifier || data.email || data.phone, {
        message: RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED,
        path: ['identifier']
    }).transform(data => {
        if (!data.identifier) {
            data.identifier = data.email || data.phone;
        }
        if (!data.targetRole && data.role) {
            data.targetRole = data.role;
        }
        return data; // RESTORED return statement
    }),

    socialLogin: z.object({
        token: z.string().min(1, 'Token is required'),
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional()
    }),

    googleLogin: z.object({
        id_token: z.string().min(1, 'Google ID token is required'),
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional()
    }),

    facebookLogin: z.object({
        accessToken: z.string().min(1, 'Facebook access token is required'),
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional()
    }),

    appleLogin: z.object({
        idToken: z.string().min(1, 'Apple ID token is required'),
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional(),
        user: z.unknown().optional(),
        email: z.string().email(RESPONSE_MESSAGES.VALIDATION.INVALID_EMAIL).optional()
    }),

    forgotPassword: z.object({
        email: z.string().email(RESPONSE_MESSAGES.VALIDATION.INVALID_EMAIL)
    }),

    // Booking Schemas
    booking: z.object({
        catalogId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.CATALOG_ID_REQUIRED).optional(),
        category: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.CATEGORY_REQUIRED).optional(),
        itemId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.ITEM_ID_REQUIRED).optional(),
        startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE,
        }),
        endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE,
        }),
        price: z.preprocess(
            (val) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? undefined : parsed;
                }
                return undefined;
            },
            z.number().positive('Price must be a positive number').optional()
        ),
        totalTravellers: z.coerce.number().int().min(1, 'Minimum 1 traveller required').optional().default(1),
    }).passthrough(),

    paymentVerification: z.object({
        razorpay_order_id: z.string().min(1, 'Razorpay order id is required'),
        razorpay_payment_id: z.string().min(1, 'Razorpay payment id is required'),
        razorpay_signature: z.string().min(1, 'Razorpay signature is required')
    }),

    bookingCancellation: z.object({
        reason: z.string().max(500).optional()
    }).optional().default({}),

    bookingDispute: z.object({
        reason: z.string().min(1, 'Dispute reason is required'),
        description: z.string().min(1, 'Dispute description is required').max(2000),
        evidence: z.unknown().optional(),
        evidenceUrls: z.array(z.union([
            z.string().url(),
            z.object({ url: z.string().url(), publicId: z.string().optional() })
        ])).optional().default([])
    }),

    // User Profile Schemas
    profileUpdate: z.object({
        name: z.string().min(2, RESPONSE_MESSAGES.VALIDATION.NAME_MIN_LENGTH).optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, RESPONSE_MESSAGES.VALIDATION.INVALID_PHONE).optional(),
    }).passthrough(),

    fcmToken: z.object({
        fcmToken: z.string().min(1, 'FCM token is required')
    }),

    accountDelete: z.object({
        reason: optionalString(500)
    }).optional().default({}),

    passwordReset: z.object({
        email: z.string().email(RESPONSE_MESSAGES.VALIDATION.INVALID_EMAIL).optional(),
        token: z.string().min(1).optional(),
        password: z.string().min(6, RESPONSE_MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH).optional(),
        newPassword: z.string().min(6, RESPONSE_MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH).optional()
    }).passthrough(),

    passwordChange: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, RESPONSE_MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH)
    }).passthrough(),

    vendorStatusToggle: z.object({
        status: z.union([z.boolean(), moderationStatus]).optional(),
        isOperating: z.coerce.boolean().optional()
    }).refine(data => data.status !== undefined || data.isOperating !== undefined, {
        message: 'Status or operating flag is required',
        path: ['status']
    }),

    emergencyContacts: z.object({
        contacts: z.array(z.object({
            name: z.string().min(1).max(100),
            phone: z.string().min(6).max(20),
            relation: optionalString(100)
        }).passthrough()).max(10).optional(),
        emergencyContacts: z.array(z.object({
            name: z.string().min(1).max(100),
            phone: z.string().min(6).max(20),
            relation: optionalString(100)
        }).passthrough()).max(10).optional()
    }).passthrough(),

    businessProfile: flexibleObject.refine(data => Object.keys(data).length > 0, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    businessOperatingStatus: z.object({
        isOperating: z.coerce.boolean()
    }).passthrough(),

    businessDocument: z.object({
        documentId: z.string().optional(),
        documentType: z.string().optional(),
        documentField: z.string().optional(),
        url: z.string().url().optional(),
        reason: optionalString(500)
    }).passthrough(),

    businessClosure: z.object({
        startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE }).optional(),
        endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE }).optional(),
        reason: optionalString(500),
        isActive: z.coerce.boolean().optional()
    }).passthrough(),

    categoryAssignment: z.object({
        slug: z.string().min(1).optional(),
        category_slug: z.string().min(1).optional(),
        category: z.string().min(1).optional()
    }).passthrough().refine(data => data.slug || data.category_slug || data.category, {
        message: RESPONSE_MESSAGES.VALIDATION.CATEGORY_REQUIRED,
        path: ['slug']
    }),

    bankDetails: z.object({
        accountHolderName: z.string().min(2).max(120).optional(),
        accountNumber: z.string().min(6).max(34).optional(),
        ifscCode: z.string().min(4).max(20).optional(),
        bankName: z.string().min(2).max(120).optional(),
        cancelledCheque: z.unknown().optional(),
        cancelledChequeFile: z.unknown().optional()
    }).passthrough(),

    packageMutation: flexibleObject.passthrough().refine(data => Object.keys(data).length > 0, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    packageStatus: z.object({
        vendorId: idString.optional(),
        userId: idString.optional(),
        serviceType: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        itemId: idString.optional(),
        status: z.union([z.boolean(), moderationStatus]).optional(),
        isActive: z.coerce.boolean().optional()
    }).passthrough(),

    bookingStatusUpdate: z.object({
        status: bookingStatus,
        reason: optionalString(500)
    }).passthrough(),

    timelineEvent: z.object({
        title: z.string().min(1).max(120).optional(),
        status: z.string().min(1).max(120).optional(),
        remarks: z.string().min(1).max(1000).optional(),
        message: z.string().min(1).max(1000).optional()
    }).passthrough().refine(data => data.title || data.status || data.remarks || data.message, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    otpVerify: z.object({
        otp: z.string().min(4, RESPONSE_MESSAGES.VALIDATION.OTP_MIN_LENGTH)
    }).passthrough(),

    offlineOtpSync: z.object({
        syncData: z.array(
            z.object({
                bookingId: idString,
                type: z.enum(['start', 'end']),
                otp: z.string().min(4),
                timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
                    message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE,
                })
            })
        ).min(1, 'At least one sync record is required')
    }).passthrough(),

    inventoryUpdate: flexibleObject.refine(data => Object.keys(data).length > 0, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    sosAlert: z.object({
        latitude: z.coerce.number().optional(),
        longitude: z.coerce.number().optional(),
        address: optionalString(500),
        message: optionalString(1000),
        type: optionalString(100)
    }).passthrough(),

    chatMessage: z.object({
        message: z.string().min(1).max(2000).optional(),
        text: z.string().min(1).max(2000).optional(),
        attachments: z.array(z.unknown()).optional(),
        target: z.string().max(50).optional()
    }).passthrough().refine(data => data.message || data.text || (Array.isArray(data.attachments) && data.attachments.length > 0), {
        message: 'Message or attachment is required',
        path: ['message']
    }),

    adminProfileUpdate: flexibleObject.refine(data => Object.keys(data).length > 0, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    adminUserMutation: flexibleObject.refine(data => Object.keys(data).length > 0, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    adminBookingMutation: flexibleObject.refine(data => Object.keys(data).length > 0, {
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
    }),

    vendorCreate: z.object({
        email: z.string().email(),
        phone: z.string().min(10).optional(),
        ownerName: z.string().min(2),
        businessName: z.string().min(2),
        password: z.string().min(6).optional()
    }).passthrough(),

    vendorUpdate: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        status: z.string().optional(),
        isVerified: z.boolean().optional(),
        isVendorVerified: z.boolean().optional(),
        ownerName: z.string().optional(),
        businessName: z.string().optional(),
        isApproved: z.boolean().optional(),
        isOperating: z.boolean().optional()
    }).passthrough(),

    adminVendorApproval: z.object({
        vendorId: idString,
        status: moderationStatus.optional(),
        reason: optionalString(500)
    }).passthrough(),

    documentVerification: z.object({
        vendorId: idString.optional(),
        documentId: idString.optional(),
        documentField: z.string().min(1).optional(),
        status: moderationStatus.optional(),
        reason: optionalString(500),
        index: z.coerce.number().int().min(0).optional()
    }).passthrough(),

    adminPayout: z.object({
        bookingId: idString,
        notes: optionalString(500)
    }).passthrough(),

    adminRefund: z.object({
        bookingId: idString,
        amount: z.coerce.number().positive('Refund amount must be positive'),
        reason: z.string().min(1).max(500)
    }).passthrough(),

    reviewModeration: z.object({
        isVisible: z.coerce.boolean().optional(),
        status: moderationStatus.optional(),
        reason: optionalString(500)
    }).passthrough(),

    disputeResolution: z.object({
        decision: z.string().min(1),
        adminNotes: optionalString(1000)
    }).passthrough(),

    inquiryUpdate: z.object({
        status: z.string().max(50).optional(),
        response: optionalString(2000),
        notes: optionalString(1000)
    }).passthrough(),

    banner: z.object({
        title: z.string().min(1).max(160).optional(),
        image: z.unknown().optional(),
        imageUrl: z.string().url().optional(),
        link: z.string().url().optional(),
        isActive: z.coerce.boolean().optional()
    }).passthrough(),

    coupon: z.object({
        code: z.string().min(1).max(40).optional(),
        discountType: z.string().max(50).optional(),
        discountValue: z.coerce.number().positive().optional(),
        expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE }).optional(),
        isActive: z.coerce.boolean().optional()
    }).passthrough(),

    category: z.object({
        name: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.NAME_REQUIRED).optional(),
        slug: z.string().min(1).optional(),
        description: optionalString(1000),
        isActive: z.coerce.boolean().optional()
    }).passthrough(),

    categoryDocument: z.object({
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        description: optionalString(1000),
        isRequired: z.coerce.boolean().optional()
    }).passthrough(),

    settingsUpdate: flexibleObject,

    blog: z.object({
        title: z.string().min(1, 'Title is required').max(150),
        excerpt: z.string().max(300).optional(),
        content: z.string().min(1, 'Content is required'),
        coverImage: z.union([z.string().url(), z.literal('')]).optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['draft', 'published']).optional()
    }).passthrough(),

    policy: z.object({
        target: z.string().min(1).optional(),
        type: z.string().min(1).optional(),
        content: z.string().min(1).optional()
    }).passthrough(),

    locationCountry: z.object({
        name: z.string().min(1),
        code: z.string().min(1).optional(),
        status: z.string().optional()
    }).passthrough(),

    locationState: z.object({
        name: z.string().min(1),
        country: idString.optional(),
        countryId: idString.optional(),
        code: z.string().optional(),
        status: z.string().optional()
    }).passthrough(),

    // Wishlist Schema
    wishlist: z.object({
        itemId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.ITEM_ID_REQUIRED).optional(),
        category: z.string().optional()
    }),

    // Review Schemas
    submitReview: z.object({
        rating: z.coerce.number().min(1).max(5),
        comment: z.string().max(1000).optional()
    })
};

/**
 * Higher-order function to validate data against a Zod schema.
 * @param {z.ZodSchema} schema
 * @param {Object} data
 * @returns {Object} { success: boolean, data: any, error: string }
 */
export const validate = (schema, data) => {
    try {
        const validData = schema.parse(data);
        return { success: DEFAULTS.TRUE, data: validData };
    } catch (error) {
        if (error instanceof z.ZodError || error.name === 'ZodError') {
            const issues = error.errors || error.issues || [];
            return {
                success: DEFAULTS.FALSE,
                error: issues.map(err => `${(err.path || []).join('.')}: ${err.message}`).join(', ') || RESPONSE_MESSAGES.ERROR.VALIDATION
            };
        }
        return { success: DEFAULTS.FALSE, error: RESPONSE_MESSAGES.ERROR.VALIDATION };
    }
};

export default { schemas, validate };
