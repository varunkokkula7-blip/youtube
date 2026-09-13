import LoginHistory from "../Modals/LoginHistory.js";
import TrustedDevice from "../Modals/TrustedDevice.js";
import users from "../Modals/Auth.js";

// ======================================================
// LOGIN HISTORY
// ======================================================

export const getLoginHistory = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const history =
      await LoginHistory.find({ userId })
        .sort({ loginTime: -1 })
        .limit(100);

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(
      "Login history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to get login history",
    });
  }
};

// ======================================================
// TRUSTED DEVICES
// ======================================================

export const getTrustedDevices = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const devices =
      await TrustedDevice.find({
        userId,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      devices,
    });
  } catch (error) {
    console.error(
      "Trusted devices error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to get trusted devices",
    });
  }
};

// ======================================================
// REMOVE TRUSTED DEVICE
// ======================================================

export const removeTrustedDevice = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    await TrustedDevice.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Trusted device removed",
    });
  } catch (error) {
    console.error(
      "Remove trusted device error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to remove trusted device",
    });
  }
};

// ======================================================
// CHANGE THEME
// ======================================================

export const changeTheme = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;
    const { theme } = req.body;

    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({
        success: false,
        message:
          "Theme must be light or dark",
      });
    }

    const user =
      await users.findByIdAndUpdate(
        userId,
        {
          themePreference: theme,
        },
        {
          new: true,
        }
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      theme: user.themePreference,
      result: user,
    });
  } catch (error) {
    console.error(
      "Theme change error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to change theme",
    });
  }
};