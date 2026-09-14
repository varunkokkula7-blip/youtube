export const getLocationFromIP = async (ipAddress) => {
  try {
    if (
      !ipAddress ||
      ipAddress === "::1" ||
      ipAddress === "127.0.0.1" ||
      ipAddress === "::ffff:127.0.0.1"
    ) {
      return {
        city: "Localhost",
        state: "Local",
        country: "India",
        latitude: null,
        longitude: null,
      };
    }

    // Remove IPv4-mapped IPv6 prefix if present
    const cleanIP = ipAddress.replace("::ffff:", "");

    console.log("Looking up location for IP:", cleanIP);

    const response = await fetch(
      `https://ipapi.co/${cleanIP}/json/`
    );

    if (!response.ok) {
      console.warn(
        "Location service returned status:",
        response.status
      );

      return {
        city: "Unknown",
        state: "Unknown",
        country: "Unknown",
        latitude: null,
        longitude: null,
      };
    }

    const data = await response.json();

    // ipapi.co can return an error object
    if (data.error) {
      console.warn(
        "Location API error:",
        data.reason || "Unknown error"
      );

      return {
        city: "Unknown",
        state: "Unknown",
        country: "Unknown",
        latitude: null,
        longitude: null,
      };
    }

    return {
      city: data.city || "Unknown",
      state: data.region || "Unknown",
      country: data.country_name || "Unknown",
      latitude:
        data.latitude !== undefined
          ? data.latitude
          : null,
      longitude:
        data.longitude !== undefined
          ? data.longitude
          : null,
    };
  } catch (error) {
    // Location is optional.
    // Login and OTP must continue even if location fails.
    console.warn(
      "Location lookup failed. Continuing login without location."
    );

    console.warn(error.message);

    return {
      city: "Unknown",
      state: "Unknown",
      country: "Unknown",
      latitude: null,
      longitude: null,
    };
  }
};