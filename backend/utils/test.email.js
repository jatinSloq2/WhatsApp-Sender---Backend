import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

console.log('Testing email with:');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('Pass:', process.env.SMTP_PASS ? '***SET***' : '***NOT SET***');

transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER, // Send to yourself
    subject: 'Test Email',
    text: 'If you receive this, email is working!',
})
    .then(() => console.log('✅ Email sent successfully!'))
    .catch((err) => console.error('❌ Email failed:', err));