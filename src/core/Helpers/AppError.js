class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;
        this.name = 'AppError';
    }

    static badRequest(message = 'Bad Request', errors = null) {
        return new AppError(message, 400, errors);
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Forbidden') {
        return new AppError(message, 403);
    }

    static notFound(message = 'Not Found') {
        return new AppError(message, 404);
    }

    static conflict(message = 'Conflict') {
        return new AppError(message, 409);
    }

    static internal(message = 'Internal Server Error') {
        return new AppError(message, 500);
    }
}

export default AppError;
