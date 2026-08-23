import users from "../Modals/Auth.js";

export const login = async (req, res) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let existinguser = await users.findOne({ email });

    if (!existinguser) {
      existinguser = await users.create({
        email,
        name: name || "",
        image: image || "",
      });
    }

    return res.status(200).json({
      success: true,
      result: existinguser,
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