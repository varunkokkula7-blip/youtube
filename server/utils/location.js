export const getLocationFromIP = async (ipAddress) => {
  try {
    if (
      !ipAddress ||
      ipAddress === "::1" ||
      ipAddress === "127.0.0.1"
    ) {
      return {
        city: "Localhost",
        state: "Local",
        country: "India",
        latitude: null,
        longitude: null,
      };
    }

    const response = await fetch(
      `https://ipapi.co/${ipAddress}/json/`
    );

    if (!response.ok) {
      throw new Error("Unable to get location");
    }

    const data = await response.json();

    return {
      city: data.city || "Unknown",
      state: data.region || "Unknown",
      country: data.country_name || "Unknown",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };
  } catch (error) {
    console.error("Location error:", error);

    return {
      city: "Unknown",
      state: "Unknown",
      country: "Unknown",
      latitude: null,
      longitude: null,
    };
  }
};