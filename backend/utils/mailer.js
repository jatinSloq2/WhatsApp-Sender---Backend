import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error("SMTP credentials missing");
}

const port = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"${process.env.APP_NAME || "Whatsapp Sender"}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
