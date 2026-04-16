import { getPendingScheduledMessages, updateScheduledMessageStatus, getContactById } from "./whatsapp.db";
import { sendWhatsAppMessage } from "./whatsapp.webhook";

/**
 * Run the scheduled message worker to send pending messages
 */
export async function runScheduledMessageWorker() {
  console.log("[Scheduled Worker] Checking for pending messages...");
  try {
    const pendingMessages = await getPendingScheduledMessages();
    
    if (pendingMessages.length === 0) {
      console.log("[Scheduled Worker] No pending messages found.");
      return;
    }

    console.log(`[Scheduled Worker] Found ${pendingMessages.length} pending messages.`);

    for (const message of pendingMessages) {
      try {
        const contact = await getContactById(message.userId, message.contactId);
        if (!contact) {
          await updateScheduledMessageStatus(message.id, "failed", "Contact not found");
          continue;
        }

        console.log(`[Scheduled Worker] Sending message ${message.id} to ${contact.phoneNumber}`);

        const result = await sendWhatsAppMessage(
          message.userId,
          contact.phoneNumber,
          message.content,
          {
            type: message.messageType as any,
            interactiveData: message.interactiveData,
          }
        );

        if (result.success) {
          await updateScheduledMessageStatus(message.id, "sent");
          console.log(`[Scheduled Worker] Successfully sent message ${message.id}`);
        } else {
          await updateScheduledMessageStatus(message.id, "failed", result.error);
          console.error(`[Scheduled Worker] Failed to send message ${message.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`[Scheduled Worker] Error processing message ${message.id}:`, error);
        await updateScheduledMessageStatus(message.id, "failed", String(error));
      }
    }
  } catch (error) {
    console.error("[Scheduled Worker] Error in worker:", error);
  }
}
