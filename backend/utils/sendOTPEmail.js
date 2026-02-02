import { sendEmail } from './mailer.js';
import { otpEmailTemplate } from './otpEmailTemplate.js';

export const sendOTPEmail = async ({ email, name, otp }) => {
  await sendEmail({
    to: email,
    subject: 'Your Email Verification OTP',
    html: otpEmailTemplate({ name, otp }),
  });
};
