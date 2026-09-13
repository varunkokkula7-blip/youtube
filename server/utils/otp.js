import crypto from "crypto";
import nodemailer from "nodemailer";

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
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
    const smtpUser =
      process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPassword =
      process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    const smtpHost =
      process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(
      process.env.SMTP_PORT || 587
    );
    const smtpSecure =
      process.env.SMTP_SECURE === "true" ||
      smtpPort === 465;

    if (
      !smtpUser ||
      !smtpPassword
    ) {
      throw new Error(
        "SMTP_USER and SMTP_PASSWORD (or EMAIL_USER and EMAIL_PASSWORD) must be configured"
      );
    }

    console.log("=================================");
    console.log("OTP EMAIL DEBUG");
    console.log("Sender:", smtpUser);
    console.log("Recipient:", email);
    console.log("OTP:", otp);
    console.log("=================================");

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: !smtpSecure && smtpPort === 587,

      auth: {
        user: smtpUser,
        pass: smtpPassword.replace(/\s/g, ""),
      },
    });

    console.log("Checking Gmail SMTP connection...");

    await transporter.verify();

    console.log("Gmail SMTP connection successful.");

    const info = await transporter.sendMail({
      from: `"YourTube Clone" <${smtpUser}>`,
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