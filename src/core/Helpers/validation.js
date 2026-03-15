import { z } from 'zod';

/**
 * Common validation schemas for the Pahadigo platform.
 */
export const schemas = {
    // Auth Schemas
    passwordLogin: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        rememberMe: z.boolean().optional()
    }),

    otpLogin: z.object({
        identifier: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        otp: z.string().min(4, 'OTP must be at least 4 digits'),
        targetRole: z.enum(['traveller', 'vendor']).optional(),
        role: z.enum(['traveller', 'vendor']).optional()
    }).refine(data => data.identifier || data.email || data.phone, {
        message: 'Either identifier, email, or phone is required',
        path: ['identifier']
    }).transform(data => {
        if (!data.identifier) {
            data.identifier = data.email || data.phone;
        }
        if (!data.targetRole && data.role) {
            data.targetRole = data.role;
        }
        return data;
    }),

    // Booking Schemas
    booking: z.object({
        catalogId: z.string().min(1, 'Catalog ID is required'),
        category: z.string().min(1, 'Category is required'),
        itemId: z.string().min(1, 'Item ID is required'),
        travelDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        })
    }),

    // User Profile Schemas
    profileUpdate: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
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
        return { success: true, data: validData };
    } catch (error) {
        if (error instanceof z.ZodError || error.name === 'ZodError') {
            const issues = error.errors || error.issues || [];
            return {
                success: false,
                error: issues.map(err => `${(err.path || []).join('.')}: ${err.message}`).join(', ') || 'Validation failed'
            };
        }
        return { success: false, error: 'Validation failed' };
    }
};
