import { Router, Request, Response } from "express";
import {
  verifyWebhookToken,
  processIncomingMessage,
  handleMessageStatusUpdate,
  type WhatsAppWebhookPayload,
} from "./whatsapp.webhook";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { whatsappConfig } from "../drizzle/schema";

const router = Router();

/**
 * GET /webhook - Webhook verification from Meta
 */
router.get("/webhook", async (req: Request, res: Response) => {
  console.log("[Webhook] Received GET request for verification");
  console.log("[Webhook] Query params:", JSON.stringify(req.query, null, 2));

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || !token || !challenge) {
    console.error("[Webhook] Verification failed: Missing or invalid parameters");
    res.status(400).send("Bad Request");
    return;
  }

  try {
    // Get all WhatsApp configs to verify token
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Verification failed: Database not available");
      res.status(500).send("Database not available");
      return;
    }

    const configs = await db.select().from(whatsappConfig);
    console.log(`[Webhook] Found ${configs.length} configs to check against`);

    // Check if token matches any config
    const isValid = configs.some((config) => {
      const match = verifyWebhookToken(token as string, config.webhookVerifyToken);
      if (match) console.log(`[Webhook] Token matched config for user ${config.userId}`);
      return match;
    });

    if (!isValid) {
      console.error(`[Webhook] Verification failed: Token "${token}" did not match any stored verify tokens`);
      res.status(403).send("Forbidden");
      return;
    }

    console.log("[Webhook] Verification successful, sending challenge back");
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(String(challenge));
  } catch (error) {
    console.error("[Webhook] Error verifying webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * POST /webhook - Receive WhatsApp messages from Meta
 */
router.post("/webhook", async (req: Request, res: Response) => {
  console.log("[Webhook] Received POST request to /webhook");
  console.log("[Webhook] Headers:", JSON.stringify(req.headers, null, 2));
  console.log("[Webhook] Body:", JSON.stringify(req.body, null, 2));
  
  const payload = req.body as WhatsAppWebhookPayload;

  // Immediately acknowledge receipt
  res.status(200).send("OK");

  try {
    if (payload.object !== "whatsapp_business_account") {
      console.log("Ignoring non-WhatsApp payload");
      return;
    }

    // Get database connection
    const db = await getDb();
    if (!db) {
      console.error("Database not available");
      return;
    }

    // Process each entry
    for (const entry of payload.entry) {
      console.log("Processing entry:", JSON.stringify(entry, null, 2));
      for (const change of entry.changes) {
        const value = change.value;
        console.log("Change value metadata:", JSON.stringify(value.metadata, null, 2));

        // Get WhatsApp config by phone number ID
        const config = await db
          .select()
          .from(whatsappConfig)
          .where(eq(whatsappConfig.businessPhoneNumberId, value.metadata.phone_number_id));

        if (!config.length) {
          console.error("WhatsApp config not found for phone number ID:", value.metadata.phone_number_id);
          console.log("Available phone number IDs in DB:");
          const allConfigs = await db.select().from(whatsappConfig);
          allConfigs.forEach(c => console.log(`- ${c.businessPhoneNumberId} (User: ${c.userId})`));
          continue;
        }

        const userId = config[0].userId;

        // Process incoming messages
        if (value.messages) {
          const profileName = value.contacts?.[0]?.profile?.name;
          for (const message of value.messages) {
            try {
              await processIncomingMessage(userId, message, value.metadata.phone_number_id, profileName);
            } catch (error) {
              console.error("Error processing message:", error);
            }
          }
        }

        // Process message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            try {
              await handleMessageStatusUpdate(userId, status.id, status.status);
            } catch (error) {
              console.error("Error handling status update:", error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in webhook handler:", error);
  }
});

export default router;
