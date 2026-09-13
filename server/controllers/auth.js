import users from "../Modals/Auth.js";
import LoginHistory from "../Modals/LoginHistory.js";
import OTP from "../Modals/otp.js";
import TrustedDevice from "../Modals/TrustedDevice.js";

import {
  generateOTP,
  hashOTP,
  generateToken,
  sendOTPEmail,
} from "../utils/otp.js";

import { getDeviceInfo } from "../utils/deviceInfo.js";
import { getLocationFromIP } from "../utils/location.js";

import crypto from "crypto";

// ======================================================
// GET CLIENT IP
// ======================================================

const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    req.socket?.remoteAddress ||
    req.ip ||
    ""
  );
};

// ======================================================
// AUTOMATIC THEME
// ======================================================

const getAutomaticTheme = () => {
  const now = new Date();

  const indiaTime = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }
  ).formatToParts(now);

  const hourPart = indiaTime.find(
    (part) => part.type === "hour"
  );

  const hour = Number(hourPart?.value || 0);

  // 6 AM through 5:59 PM = light
  // 6 PM through 5:59 AM = dark

  if (hour >= 6 && hour < 18) {
    return "light";
  }

  return "dark";
};

// ======================================================
// LOGIN
// ======================================================

export const login = async (req, res) => {
  try {
    const {
      email: submittedEmail,
      name,
      image,
      deviceToken,
    } = req.body;
    const email = String(submittedEmail || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // --------------------------------------------------
    // FIND / CREATE USER
    // --------------------------------------------------

    let existinguser = await users.findOne({ email });

    if (!existinguser) {
      existinguser = await users.create({
        email,
        name: name || "",
        image: image || "",

      });
    }

    // --------------------------------------------------
    // UPDATE BASIC INFORMATION
    // --------------------------------------------------

    if (name && existinguser.name !== name) {
      existinguser.name = name;
    }

    if (image && existinguser.image !== image) {
      existinguser.image = image;
    }

    await existinguser.save();

    // --------------------------------------------------
    // DEVICE INFORMATION
    // --------------------------------------------------

    const ipAddress = getClientIP(req);

    const deviceInfo = getDeviceInfo(req);

    const location =
      await getLocationFromIP(ipAddress);

    // --------------------------------------------------
    // CHECK TRUSTED DEVICE
    // --------------------------------------------------

    let trustedDevice = null;

    if (deviceToken) {
      const deviceTokenHash = crypto
        .createHash("sha256")
        .update(deviceToken)
        .digest("hex");

      trustedDevice =
        await TrustedDevice.findOne({
          userId: existinguser._id,
          deviceTokenHash,
          expiresAt: { $gt: new Date() },
        });
    }

    // --------------------------------------------------
    // NEW DEVICE
    // --------------------------------------------------

    if (!trustedDevice) {
      const otp = generateOTP();

      const otpHash = hashOTP(otp);

      const challengeToken = generateToken();

      await OTP.deleteMany({
        userId: existinguser._id,
        verified: false,
      });

      await OTP.create({
        userId: existinguser._id,
        email: existinguser.email,
        otpHash,
        challengeToken,
        deviceToken: deviceToken || "",
        expiresAt: new Date(
          Date.now() + 10 * 60 * 1000
        ),
      });

      // Login attempt record
      await LoginHistory.create({
        userId: existinguser._id,
        email: existinguser.email,

        ipAddress,

        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,

        operatingSystem:
          deviceInfo.operatingSystem,

        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,

        city: location.city,
        state: location.state,
        country: location.country,

        latitude: location.latitude,
        longitude: location.longitude,

        status: "otp_required",
      });

      try {
        await sendOTPEmail(
          existinguser.email,
          otp
        );
      } catch (emailError) {
        console.error(
          "OTP email error:",
          emailError
        );

        await OTP.deleteOne({
          challengeToken,
        });

        return res.status(500).json({
          success: false,
          message:
            "Unable to send OTP to your email. Check the Gmail app password and email configuration.",
        });
      }

      return res.status(202).json({
        success: false,
        otpRequired: true,
        email: existinguser.email,
        challengeToken,

        message:
          "New login detected. OTP verification required.",
      });
    }

    // --------------------------------------------------
    // TRUSTED DEVICE LOGIN
    // --------------------------------------------------

    await LoginHistory.create({
      userId: existinguser._id,
      email: existinguser.email,

      ipAddress,

      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,

      operatingSystem:
        deviceInfo.operatingSystem,

      deviceType: deviceInfo.deviceType,
      deviceModel: deviceInfo.deviceModel,

      city: location.city,
      state: location.state,
      country: location.country,

      latitude: location.latitude,
      longitude: location.longitude,

      status: "success",
    });

    return res.status(200).json({
      success: true,
      otpRequired: false,
      result: existinguser,
      theme:
        existinguser.themePreference ||
        getAutomaticTheme(),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// VERIFY OTP
// ======================================================

export const verifyOTP = async (req, res) => {
  try {
    const {
      email,
      otp,
      challengeToken,
    } = req.body;

    if (!email || !otp || !challengeToken) {
      return res.status(400).json({
        success: false,
        message:
          "Email, OTP and challenge token are required",
      });
    }

    const otpRecord = await OTP.findOne({
      email,
      challengeToken,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          "OTP expired or verification request is invalid",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many OTP attempts. Please login again.",
      });
    }

    const submittedHash = hashOTP(otp);

    if (submittedHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining:
          5 - otpRecord.attempts,
      });
    }

    otpRecord.verified = true;

    await otpRecord.save();

    const user = await users.findById(
      otpRecord.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------------------
    // CREATE TRUSTED DEVICE
    // --------------------------------------------------

    const newDeviceToken = generateToken();

    const deviceTokenHash = crypto
      .createHash("sha256")
      .update(newDeviceToken)
      .digest("hex");

    const ipAddress = getClientIP(req);

    const deviceInfo = getDeviceInfo(req);

    const location =
      await getLocationFromIP(ipAddress);

    // Trusted for 30 days
    await TrustedDevice.create({
      userId: user._id,

      deviceTokenHash,

      browser: deviceInfo.browser,
      operatingSystem:
        deviceInfo.operatingSystem,

      deviceType: deviceInfo.deviceType,
      deviceModel: deviceInfo.deviceModel,

      ipAddress,

      city: location.city,
      state: location.state,
      country: location.country,

      expiresAt: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ),
    });

    // --------------------------------------------------
    // SUCCESSFUL LOGIN
    // --------------------------------------------------

    await LoginHistory.create({
      userId: user._id,
      email: user.email,

      ipAddress,

      browser: deviceInfo.browser,
      browserVersion:
        deviceInfo.browserVersion,

      operatingSystem:
        deviceInfo.operatingSystem,

      deviceType: deviceInfo.deviceType,
      deviceModel: deviceInfo.deviceModel,

      city: location.city,
      state: location.state,
      country: location.country,

      latitude: location.latitude,
      longitude: location.longitude,

      status: "success",
    });

    return res.status(200).json({
      success: true,

      result: user,

      deviceToken: newDeviceToken,

      message:
        "OTP verified successfully. Device trusted for 30 days.",
    });
  } catch (error) {
    console.error(
      "OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};