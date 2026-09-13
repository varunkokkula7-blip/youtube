import { UAParser } from "ua-parser-js";

export const getDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";

  const parser = new UAParser(userAgent);

  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType = "Desktop";

  if (device.type === "mobile") {
    deviceType = "Mobile";
  } else if (device.type === "tablet") {
    deviceType = "Tablet";
  }

  return {
    browser: browser.name || "Unknown",
    browserVersion: browser.version || "Unknown",

    operatingSystem: `${os.name || "Unknown"} ${
      os.version || ""
    }`.trim(),

    deviceType,

    deviceModel:
      device.model ||
      device.vendor ||
      "Unknown",
  };
};