import crypto from "crypto";

// Generate a 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP before storing it in the database
export const hashOTP = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

// Generate a secure token
export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send OTP email using Brevo
export const sendOTPEmail = async (email, otp) => {
  try {
    console.log("Sending OTP email to:", email);

    // Brevo API key
    const apiKey = process.env.BREVO_API_KEY;

    // Verified Brevo sender email
    const fromEmail = process.env.BREVO_FROM_EMAIL;

    // Sender name
    const fromName =
      process.env.BREVO_FROM_NAME || "YouTube Clone";

    // Check API key
    if (!apiKey) {
      throw new Error(
        "BREVO_API_KEY is not configured"
      );
    }

    // Check sender email
    if (!fromEmail) {
      throw new Error(
        "BREVO_FROM_EMAIL is not configured"
      );
    }

    // Check recipient
    if (!email) {
      throw new Error(
        "Recipient email is required"
      );
    }

    // Check OTP
    if (!otp) {
      throw new Error(
        "OTP is required"
      );
    }

    // Email content
    const emailData = {
      sender: {
        name: fromName,
        email: fromEmail,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: "Your YouTube Clone Login OTP",

      text:
        "Your YouTube Clone Login OTP\n\n" +
        "Your verification code is: " +
        otp +
        "\n\n" +
        "This code expires in 10 minutes.\n\n" +
        "If you did not request this OTP, please ignore this email.",

      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>YouTube Clone OTP</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
              font-family: Arial, Helvetica, sans-serif;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
              "
            >
              <h2
                style="
                  margin-bottom: 20px;
                  color: #222222;
                "
              >
                YouTube Clone
              </h2>

              <p
                style="
                  font-size: 16px;
                  color: #444444;
                "
              >
                Your login verification code is:
              </p>

              <div
                style="
                  margin: 25px 0;
                  padding: 20px;
                  text-align: center;
                  background: #f2f2f2;
                  border-radius: 8px;
                "
              >
                <span
                  style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #111111;
                  "
                >
                  ${otp}
                </span>
              </div>

              <p
                style="
                  font-size: 14px;
                  color: #666666;
                "
              >
                This OTP expires in 10 minutes.
              </p>

              <p
                style="
                  font-size: 14px;
                  color: #666666;
                "
              >
                If you did not request this OTP,
                please ignore this email.
              </p>

              <hr
                style="
                  border: 0;
                  border-top: 1px solid #eeeeee;
                  margin: 25px 0;
                "
              />

              <p
                style="
                  font-size: 12px;
                  color: #999999;
                "
              >
                This is an automated email from
                YouTube Clone.
              </p>
            </div>
          </body>
        </html>
      `,
    };

    // Send email through Brevo
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },

        body: JSON.stringify(emailData),
      }
    );

    // Read Brevo response
    const data = await response.json();

    // Check for Brevo errors
    if (!response.ok) {
      console.error(
        "Brevo error:",
        data
      );

      throw new Error(
        data.message ||
          "Failed to send OTP email"
      );
    }

    // Success
    console.log(
      "OTP email sent successfully"
    );

    console.log(
      "Brevo Message ID:",
      data.messageId
    );

    return data;
  } catch (error) {
    console.error(
      "OTP EMAIL ERROR:",
      error
    );

    throw error;
  }
};