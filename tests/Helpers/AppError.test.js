import { jest } from '@jest/globals';

const { default: AppError } = await import('@/core/Helpers/AppError.js');

describe('AppError Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should construct AppError with custom message, status code and errors', () => {
        const error = new AppError('Custom Error Message', 422, { field: 'invalid' });
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('AppError');
        expect(error.message).toBe('Custom Error Message');
        expect(error.statusCode).toBe(422);
        expect(error.status).toBe('fail');
        expect(error.isOperational).toBe(true);
        expect(error.errors).toEqual({ field: 'invalid' });
    });

    it('should default status to error for 500 status codes', () => {
        const error = new AppError('Server Crash', 500);
        expect(error.status).toBe('error');
    });

    it('should create badRequest error (400)', () => {
        const error = AppError.badRequest('Invalid input payload', { id: 'required' });
        expect(error.statusCode).toBe(400);
        expect(error.status).toBe('fail');
        expect(error.message).toBe('Invalid input payload');
        expect(error.errors).toEqual({ id: 'required' });
    });

    it('should create unauthorized error (401)', () => {
        const error = AppError.unauthorized();
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Unauthorized');
    });

    it('should create forbidden error (403)', () => {
        const error = AppError.forbidden();
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Forbidden');
    });

    it('should create notFound error (404)', () => {
        const error = AppError.notFound('Resource missing');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource missing');
    });

    it('should create conflict error (409)', () => {
        const error = AppError.conflict('Email already exists');
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Email already exists');
    });

    it('should create internal error (500)', () => {
        const error = AppError.internal();
        expect(error.statusCode).toBe(500);
        expect(error.status).toBe('error');
        expect(error.message).toBe('Internal Server Error');
    });
});
