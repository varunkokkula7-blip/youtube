import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendSubscriptionEmail = async (
  email,
  subscription
) => {
  try {
    await transporter.sendMail({
      from: `"Your-Tube Clone" <${process.env.EMAIL_USER}>`,

      to: email,

      subject: `Your ${subscription.plan} subscription is active`,

      html: `
        <div style="font-family: Arial; padding: 20px;">

          <h2>Subscription Successful ✓</h2>

          <p>
            Thank you for subscribing to Your-Tube Clone.
          </p>

          <hr />

          <p>
            <strong>Plan:</strong>
            ${subscription.plan}
          </p>

          <p>
            <strong>Duration:</strong>
            ${subscription.duration}
          </p>

          <p>
            <strong>Amount:</strong>
            ₹${subscription.amount}
          </p>

          <p>
            <strong>Invoice:</strong>
            ${subscription.invoiceNumber}
          </p>

          <p>
            <strong>Payment ID:</strong>
            ${subscription.paymentId}
          </p>

          <p>
            <strong>Order ID:</strong>
            ${subscription.orderId}
          </p>

          <p>
            <strong>Start Date:</strong>
            ${new Date(
              subscription.startDate
            ).toLocaleDateString()}
          </p>

          <p>
            <strong>Expiry Date:</strong>
            ${new Date(
              subscription.expiryDate
            ).toLocaleDateString()}
          </p>

          <hr />

          <p>
            Your premium features are now active.
          </p>

          <p>
            Thank you for using Your-Tube Clone.
          </p>

        </div>
      `,
    });

    console.log("Subscription email sent");
  } catch (error) {
    console.error(
      "Subscription email error:",
      error
    );
  }
};