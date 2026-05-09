import { z } from 'zod';
import { RESPONSE_MESSAGES, USER_ROLES, DEFAULTS } from '@/core/Constants/index.js';

/**
 * Common validation schemas for the Pahadigo platform.
 */
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
        role: z.enum([USER_ROLES.TRAVELLER, USER_ROLES.VENDOR]).optional()
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

    // Booking Schemas
    booking: z.object({
        catalogId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.CATALOG_ID_REQUIRED),
        category: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.CATEGORY_REQUIRED),
        itemId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.ITEM_ID_REQUIRED),
        startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE,
        }),
        endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: RESPONSE_MESSAGES.VALIDATION.INVALID_DATE,
        }),
        price: z.number().positive('Price must be a positive number'),
        totalTravellers: z.number().int().min(1, 'Minimum 1 traveller required').optional().default(1),
    }),

    // User Profile Schemas
    profileUpdate: z.object({
        name: z.string().min(2, RESPONSE_MESSAGES.VALIDATION.NAME_MIN_LENGTH).optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, RESPONSE_MESSAGES.VALIDATION.INVALID_PHONE).optional(),
    }),

    // Wishlist Schema
    wishlist: z.object({
        itemId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.ITEM_ID_REQUIRED),
        category: z.string().optional()
    }),

    // Review Schemas
    submitReview: z.object({
        bookingId: z.string().min(1, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED),
        rating: z.number().int().min(1).max(5),
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
