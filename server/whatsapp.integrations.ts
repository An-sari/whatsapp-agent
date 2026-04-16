import { getExternalWebhooks } from "./whatsapp.db";

/**
 * Dispatch event to external webhooks
 */
export async function dispatchExternalWebhook(
  userId: number,
  eventType: string,
  payload: any
) {
  try {
    const webhooks = await getExternalWebhooks(userId);
    const activeWebhooks = webhooks.filter(
      (w) => w.isActive && w.events?.includes(eventType)
    );

    if (activeWebhooks.length === 0) return;

    console.log(`Dispatching ${eventType} to ${activeWebhooks.length} webhooks`);

    const promises = activeWebhooks.map(async (webhook) => {
      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": webhook.secret || "",
            "X-WhatsApp-Event": eventType,
          },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            payload,
          }),
        });

        if (!response.ok) {
          console.error(`Webhook ${webhook.name} failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`Error calling webhook ${webhook.name}:`, error);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error in dispatchExternalWebhook:", error);
  }
}
