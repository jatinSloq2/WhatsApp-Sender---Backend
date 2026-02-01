import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

// ─── Sign ─────────────────────────────────────────────
export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });

// ─── Verify ───────────────────────────────────────────
export const verifyAccessToken = (token) =>
  jwt.verify(token, ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, REFRESH_SECRET);

// ─── Cookie helpers ───────────────────────────────────
const cookieOptions = (maxAge) => ({
  httpOnly: true,          // JS cannot read it — prevents XSS theft
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge,                  // in ms
});

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));          // 15 min
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
};

export const clearAuthCookies = (res) => {
  res.cookie('accessToken', '', { ...cookieOptions(0), maxAge: 0 });
  res.cookie('refreshToken', '', { ...cookieOptions(0), maxAge: 0 });
};