// ─── Custom error class ──────────────────────────────
export class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ─── Express error-handling middleware ────────────────
export const errorHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong.';

    // Log full stack in dev
    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(err.details && { details: err.details }),
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        },
    });
};