export const otpEmailTemplate = ({ name, otp }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
    <style>
      body {
        background-color: #0f172a;
        font-family: Arial, sans-serif;
        padding: 20px;
        color: #e5e7eb;
      }
      .container {
        max-width: 480px;
        margin: auto;
        background: #020617;
        border-radius: 12px;
        padding: 30px;
        text-align: center;
      }
      .logo {
        font-size: 22px;
        font-weight: bold;
        color: #38bdf8;
        margin-bottom: 20px;
      }
      .otp {
        font-size: 32px;
        letter-spacing: 8px;
        font-weight: bold;
        color: #22c55e;
        margin: 20px 0;
      }
      .text {
        color: #cbd5f5;
        font-size: 14px;
        line-height: 1.6;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">Mini Auth</div>

      <p class="text">Hi ${name || 'there'},</p>

      <p class="text">
        Use the following One-Time Password (OTP) to verify your email.
        This OTP is valid for <strong>10 minutes</strong>.
      </p>

      <div class="otp">${otp}</div>

      <p class="text">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <div class="footer">
        © ${new Date().getFullYear()} Mini Auth. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
