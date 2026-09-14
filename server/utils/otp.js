import crypto from "crypto";

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const fromEmail =
      process.env.RESEND_FROM ||
      "YourTube Clone <onboarding@resend.dev>";

    const emailData = {
      from: fromEmail,
      to: [email],
      subject: "Your YouTube Clone Login OTP",
      text:
        "Your YouTube Clone Login OTP\n\n" +
        "Your verification code is: " +
        otp +
        "\n\nThis code expires in 10 minutes.",
    };

    console.log("Sending OTP email to:", email);

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify(emailData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);

      throw new Error(
        data.message || "Failed to send OTP email"
      );
    }

    console.log("OTP email sent successfully");
    console.log("Message ID:", data.id);

    return data;
  } catch (error) {
    console.error("OTP EMAIL ERROR:", error);
    throw error;
  }
};