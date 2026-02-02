// utils/otp.utils.js
import crypto from 'crypto';

export const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

export const otpExpiry = () =>
  Date.now() + 10 * 60 * 1000; // 10 minutes
