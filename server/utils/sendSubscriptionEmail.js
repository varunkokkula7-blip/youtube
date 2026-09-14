export const sendSubscriptionEmail = async (email, subscription) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is missing");
      return null;
    }

    const fromEmail =
      process.env.RESEND_FROM ||
      "YourTube Clone <onboarding@resend.dev>";

    const plan = subscription.plan || "Unknown";
    const duration = subscription.duration || "Unknown";
    const amount = subscription.amount || 0;
    const invoiceNumber = subscription.invoiceNumber || "N/A";
    const paymentId = subscription.paymentId || "N/A";
    const orderId = subscription.orderId || "N/A";

    const startDate = subscription.startDate
      ? new Date(subscription.startDate).toLocaleDateString()
      : "N/A";

    const expiryDate = subscription.expiryDate
      ? new Date(subscription.expiryDate).toLocaleDateString()
      : "N/A";

    const html =
      "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">" +
      "<h2>Subscription Successful</h2>" +
      "<p>Thank you for subscribing to Your-Tube Clone.</p>" +
      "<hr>" +
      "<p><strong>Plan:</strong> " + plan + "</p>" +
      "<p><strong>Duration:</strong> " + duration + "</p>" +
      "<p><strong>Amount:</strong> Rs. " + amount + "</p>" +
      "<p><strong>Invoice:</strong> " + invoiceNumber + "</p>" +
      "<p><strong>Payment ID:</strong> " + paymentId + "</p>" +
      "<p><strong>Order ID:</strong> " + orderId + "</p>" +
      "<p><strong>Start Date:</strong> " + startDate + "</p>" +
      "<p><strong>Expiry Date:</strong> " + expiryDate + "</p>" +
      "<hr>" +
      "<p>Your premium features are now active.</p>" +
      "<p>Thank you for using Your-Tube Clone.</p>" +
      "</div>";

    const emailData = {
      from: fromEmail,
      to: [email],
      subject: "Your " + plan + " subscription is active",
      html: html
    };

    console.log("Sending subscription email to:", email);

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey
        },
        body: JSON.stringify(emailData)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return null;
    }

    console.log("Subscription email sent successfully");
    console.log("Message ID:", data.id);

    return data;
  } catch (error) {
    console.error("Subscription email error:", error);
    return null;
  }
};