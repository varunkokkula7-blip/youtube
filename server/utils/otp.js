import crypto from "crypto";
import nodemailer from "nodemailer";

export const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

export const hashOTP = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const sendOTPEmail = async (email, otp) => {
  try {
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASSWORD
    ) {
      throw new Error(
        "EMAIL_USER and EMAIL_PASSWORD must be configured"
      );
    }

    console.log("=================================");
    console.log("OTP EMAIL DEBUG");
    console.log("Sender:", process.env.EMAIL_USER);
    console.log("Recipient:", email);
    console.log("OTP:", otp);
    console.log("=================================");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD.replace(/\s/g, ""),
      },
    });

    console.log("Checking Gmail SMTP connection...");

    await transporter.verify();

    console.log("Gmail SMTP connection successful.");

    const info = await transporter.sendMail({
      from: `"YourTube Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your YouTube Clone Login OTP",

      text: `Your YouTube Clone Login OTP

Your verification code is:

${otp}

This code expires in 10 minutes.`,

      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Your YouTube Clone Login OTP</h2>

          <p>A new login was detected on your account.</p>

          <p>Your verification code is:</p>

          <h1>${otp}</h1>

          <p>This OTP expires in 10 minutes.</p>

          <p>If you did not attempt to log in, please secure your account.</p>
        </div>
      `,
    });

    console.log("OTP email sent successfully!");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("=================================");
    console.error("OTP EMAIL ERROR");
    console.error(error);
    console.error("=================================");

    throw error;
  }
};