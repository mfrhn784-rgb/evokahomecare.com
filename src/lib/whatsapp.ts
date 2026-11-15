import { Order } from "@/lib/types";
import { BRAND } from "@/lib/brand";

/**
 * Builds the official EVOKA WhatsApp order notification sent to the customer
 * containing their unique Order ID and 1-click secure tracking link.
 */
export function buildCustomerOrderWhatsAppMessage(order: Order, baseUrl?: string): string {
  const cleanPhone = order.phone.replace(/\D/g, "").slice(-10);
  const domain = baseUrl || "https://evokahomecare.com";
  const trackingUrl = `${domain}/orders?id=${encodeURIComponent(order.id)}&phone=${cleanPhone}`;

  const summary = order.items
    .map((i) => `• ${i.name} (${i.variantLabel}) x ${i.quantity} = ₹${i.price * i.quantity}`)
    .join("\n");

  const deliveryText =
    order.fulfillmentType === "pickup"
      ? `Store Pickup (${order.pickupOutlet || "Poovar / Pallichal"})`
      : `Delivery to ${order.address.line1}, ${order.address.city} - ${order.address.pincode}`;

  return [
    `*EVOKA Home & Personal Care* 🌿`,
    `Order Confirmation & Tracking`,
    ``,
    `Dear ${order.customerName},`,
    `Thank you for ordering with EVOKA! Your order has been successfully recorded.`,
    ``,
    `📦 *Order ID:* \`${order.id}\``,
    `💰 *Total Amount:* ₹${order.total}`,
    `💳 *Payment Method:* ${order.paymentMethod === "upi" ? "UPI Prepaid" : "Cash on Delivery (COD)"}`,
    `📍 *Fulfillment:* ${deliveryText}`,
    ``,
    `🛒 *Items Ordered:*`,
    summary,
    ``,
    `🔗 *1-Click Secure Tracking & Tax Invoice:*`,
    trackingUrl,
    ``,
    `💡 *Note:* Keep your Order ID (*${order.id}*) handy. You can use the link above anytime to check live order status or download your invoice.`,
    ``,
    `Need help? Call or WhatsApp EVOKA at ${BRAND.phone}.`,
    `EVOKA Home & Personal Care, Pallichal, Trivandrum`,
  ].join("\n");
}

/**
 * Sends an automated WhatsApp message to the customer if WhatsApp Cloud API credentials
 * (WHATSAPP_CLOUD_API_TOKEN & WHATSAPP_PHONE_NUMBER_ID) are configured in the environment.
 */
export async function sendAutomatedWhatsAppToCustomer(order: Order): Promise<boolean> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    // Cloud API not yet configured in environment variables; fallback to Admin 1-Click dispatch
    return false;
  }

  const cleanPhone = order.phone.replace(/\D/g, "").slice(-10);
  const recipient = `91${cleanPhone}`;
  const messageText = buildCustomerOrderWhatsAppMessage(order);

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { preview_url: true, body: messageText },
      }),
    });

    if (!res.ok) {
      console.warn("WhatsApp Cloud API failed to dispatch message:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error sending automated WhatsApp:", err);
    return false;
  }
}
