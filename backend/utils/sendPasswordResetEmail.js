import { sendEmail } from "./mailer.js";

export const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #333333;
          margin-top: 0;
          font-size: 22px;
        }
        .content p {
          color: #666666;
          line-height: 1.6;
          font-size: 16px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .reset-button {
          display: inline-block;
          padding: 14px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .reset-button:hover {
          transform: translateY(-2px);
        }
        .alternative-link {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 6px;
          word-break: break-all;
        }
        .alternative-link p {
          margin: 5px 0;
          font-size: 14px;
        }
        .alternative-link a {
          color: #667eea;
          text-decoration: none;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          color: #999999;
          font-size: 14px;
          margin: 5px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning p {
          color: #856404;
          margin: 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <p>We received a request to reset your password for your <strong>${process.env.APP_NAME || 'WhatsApp Sender'}</strong> account.</p>
          
          <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
          
          <div class="button-container">
            <a href="${resetURL}" class="reset-button">Reset Password</a>
          </div>
          
          <div class="alternative-link">
            <p><strong>Or copy and paste this link into your browser:</strong></p>
            <a href="${resetURL}">${resetURL}</a>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
          </div>
          
          <p style="margin-top: 30px;">This password reset link will expire in 1 hour for security reasons.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'WhatsApp Sender'}. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html,
  });
};