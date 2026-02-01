import User from '../models/user.model.js';
import { verifyAccessToken } from '../utils/jwt.utils.js';
import { ApiError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(401, 'No access token found. Please log in.');
        }

        const { sub: userId } = verifyAccessToken(token);

        const user = await User.findById(userId).select(
            '-password -emailVerifyToken -emailVerifyExp -passwordResetToken -passwordResetExp'
        );

        if (!user) {
            throw new ApiError(401, 'User not found. Please log in again.');
        }

        req.user = user;
        next();
    } catch (err) {
        // If jwt.verify throws (expired / malformed), wrap it
        if (err.name === 'TokenExpiredError') {
            return next(new ApiError(401, 'Token expired. Please refresh.'));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new ApiError(401, 'Invalid token.'));
        }
        next(err);
    }
};

// ─── Optional: require verified email ─────────────────
export const requireVerified = (req, _res, next) => {
    if (!req.user.isVerified) {
        return next(new ApiError(403, 'Email verification required.'));
    }
    next();
};

// ─── Optional: require ADMIN role ─────────────────────
export const requireAdmin = (req, _res, next) => {
    if (req.user.role !== 'ADMIN') {
        return next(new ApiError(403, 'Admin access required.'));
    }
    next();
};