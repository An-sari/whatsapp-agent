import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { dispatchExternalWebhook } from "./whatsapp.integrations";
import { GoogleGenAI } from "@google/genai";
import {
  getWhatsappConfig,
  getWhatsappConfigByPhoneId,
  getOrCreateContact,
  getOrCreateConversation,
  createMessage,
  getAgentConfig,
  logAnalyticsEvent,
  createNotification,
  getMessagesByConversation,
  updateContact,
} from "./whatsapp.db";

import { ENV } from "./_core/env";

/**
 * Verify webhook token from Meta
 */
export function verifyWebhookToken(token: string, verifyToken: string): boolean {
  if (!token || !verifyToken) return false;
  return token.trim() === verifyToken.trim();
}

/**
 * Parse incoming WhatsApp message from webhook
 */
export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppIncomingMessage[];
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
    }>;
  }>;
}

/**
 * Get media URL from WhatsApp API
 */
async function getWhatsAppMediaUrl(userId: number, mediaId: string, configId?: number): Promise<string | null> {
  try {
    const { getWhatsappConfigById } = await import("./whatsapp.db");
    const config = configId ? await getWhatsappConfigById(configId) : await getWhatsappConfig(userId);
    if (!config) return null;

    const response = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const data = (await response.json()) as any;
    return data.url || null;
  } catch (error) {
    console.error("Error getting WhatsApp media URL:", error);
    return null;
  }
}

/**
 * Transcribe audio using Gemini
 */
async function transcribeAudio(userId: number, mediaUrl: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: ENV.geminiApiKey });
    
    // Fetch audio data
    const response = await fetch(mediaUrl);
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Transcribe this WhatsApp voice message accurately. Only return the transcription text." },
            {
              inlineData: {
                data: base64Audio,
                mimeType: "audio/ogg; codecs=opus", // WhatsApp standard
              },
            },
          ],
        },
      ],
    });

    return result.text || null;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return null;
  }
}

/**
 * Process incoming WhatsApp message
 */
export async function processIncomingMessage(
  userId: number,
  message: WhatsAppIncomingMessage,
  phoneNumberId: string,
  profileName?: string
) {
  console.log(`[Webhook] Processing incoming message from ${message.from} for user ${userId}. Message ID: ${message.id}`);
  try {
    // Get WhatsApp config by phone number ID
    const config = await getWhatsappConfigByPhoneId(phoneNumberId);
    if (!config) {
      console.error(`[Webhook] WhatsApp config not found for phone number ID: ${phoneNumberId}`);
      return;
    }

    const configId = config.id;

    // Get or create contact
    console.log(`[Webhook] Getting or creating contact for ${message.from}...`);
    const contact = await getOrCreateContact(userId, message.from, profileName || message.from, configId);
    if (!contact) {
      console.error("[Webhook] Failed to create or find contact for number:", message.from);
      return;
    }
    console.log(`[Webhook] Contact found/created: ID ${contact.id}`);

    // Update online status
    await updateContact(userId, contact.id, {
      isOnline: true,
      lastSeenAt: new Date(),
    });

    // Get or create conversation
    console.log(`[Webhook] Getting or creating conversation for contact ID ${contact.id}...`);
    const conversation = await getOrCreateConversation(userId, contact.id, message.from, configId);
    if (!conversation) {
      console.error("[Webhook] Failed to create or find conversation for contact ID:", contact.id);
      return;
    }
    console.log(`[Webhook] Conversation found/created: ID ${conversation.id}`);

    // Stop any active nurture sequences for this contact
    const { stopNurtureForContact } = await import("./nurture.db");
    await stopNurtureForContact(contact.id);

    // Handle media URL if applicable
    let mediaUrl: string | undefined;
    let content = message.text?.body || `[${message.type} message]`;
    let transcription: string | undefined;

    if (message.type === "image" && message.image) {
      mediaUrl = (await getWhatsAppMediaUrl(userId, message.image.id, configId)) || undefined;
      content = "[Image]";
    } else if (message.type === "document" && message.document) {
      mediaUrl = (await getWhatsAppMediaUrl(userId, message.document.id, configId)) || undefined;
      content = "[Document]";
    } else if (message.type === "audio" && message.audio) {
      mediaUrl = (await getWhatsAppMediaUrl(userId, message.audio.id, configId)) || undefined;
      content = "[Audio]";
      
      // Transcribe voice messages
      if (mediaUrl) {
        transcription = (await transcribeAudio(userId, mediaUrl)) || undefined;
        if (transcription) {
          content = `[Voice Message]: ${transcription}`;
        }
      }
    } else if (message.type === "video" && message.video) {
      mediaUrl = (await getWhatsAppMediaUrl(userId, message.video.id, configId)) || undefined;
      content = "[Video]";
    } else if (message.type === "interactive" && message.interactive) {
      const interactive = message.interactive;
      if (interactive.type === "button_reply" && interactive.button_reply) {
        content = interactive.button_reply.title;
      } else if (interactive.type === "list_reply" && interactive.list_reply) {
        content = interactive.list_reply.title;
      }
    }

    // Store incoming message
    const incomingMsg = await createMessage({
      userId,
      configId,
      conversationId: conversation.id,
      whatsappMessageId: message.id,
      sender: "customer",
      messageType: message.type as any,
      content,
      mediaUrl,
      status: "delivered",
    });

    // Dispatch external webhook
    await dispatchExternalWebhook(userId, "message_received", {
      messageId: incomingMsg,
      conversationId: conversation.id,
      contactId: contact.id,
      from: message.from,
      content,
      messageType: message.type,
      mediaUrl,
    });

    // Log analytics event
    await logAnalyticsEvent({
      userId,
      conversationId: conversation.id,
      eventType: "message_received",
      metadata: {
        messageType: message.type,
        from: message.from,
        hasMedia: !!mediaUrl,
      },
    });

    // Get agent config
    const agent = await getAgentConfig(userId);
    if (!agent || !agent.isActive || !agent.autoRespond || conversation.humanAgentActive) {
      console.log("Agent is not active, auto-respond is disabled, or human agent is active");
      return;
    }

    // Only auto-respond to text messages for now
    if (message.type !== "text") {
      console.log("Non-text message received, skipping auto-respond");
      return;
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(
      message.text?.body || "",
      agent,
      conversation.id,
      userId
    );

    // AI Lead Qualification & Scoring
    try {
      const qualificationResult = await qualifyLead(
        message.text?.body || "",
        conversation.id,
        userId,
        agent
      );
      
        if (qualificationResult) {
          await updateContact(userId, contact.id, {
            leadScore: (contact.leadScore || 0) + qualificationResult.scoreIncrement,
            segment: qualificationResult.suggestedSegment || contact.segment,
          });
          
          if (qualificationResult.isQualified) {
            const { updateConversation } = await import("./whatsapp.db");
            await updateConversation(conversation.id, { leadQualified: true });
          }
        
        if (qualificationResult.isQualified && !conversation.leadQualified) {
          await createNotification({
            userId,
            conversationId: conversation.id,
            title: "Lead Qualified! 🎯",
            content: `Contact ${contact.displayName || contact.phoneNumber} has been qualified as a high-intent lead.`,
            type: "lead",
          });

          // Auto-sync to Zoho if configured
          try {
            const { syncContactToZoho } = await import("./zoho.service");
            await syncContactToZoho(userId, contact.id);
            console.log(`[Webhook] Automatically synced qualified lead ${contact.id} to Zoho CRM`);
          } catch (zohoError) {
            console.error("[Webhook] Failed to auto-sync to Zoho:", zohoError);
          }
        }
      }
    } catch (error) {
      console.error("Error in lead qualification:", error);
    }

    if (!aiResponse) {
      console.error("Failed to generate AI response");
      return;
    }

    // Check for escalation keywords
    const shouldEscalate = checkEscalationKeywords(
      message.text?.body || "",
      agent.escalationKeywords || []
    );

    if (shouldEscalate) {
      // Set human agent active in conversation
      const { updateConversation } = await import("./whatsapp.db");
      await updateConversation(conversation.id, { 
        humanAgentActive: true,
        status: "escalated" 
      });

      // Create escalation notification
      await createNotification({
        userId,
        conversationId: conversation.id,
        title: "Escalation Required",
        content: `Customer message requires human intervention: "${content}"`,
        type: "escalation",
      });

      // Notify owner
      await notifyOwner({
        title: "WhatsApp Escalation",
        content: `Customer from ${message.from} needs assistance: "${content}"`,
      });

      // Dispatch external webhook
      await dispatchExternalWebhook(userId, "escalation_triggered", {
        conversationId: conversation.id,
        contactId: contact.id,
        reason: "Keyword match",
        messageContent: content,
      });
    }

    // Store AI response message
    const responseMsg = await createMessage({
      userId,
      configId,
      conversationId: conversation.id,
      sender: "agent",
      messageType: "text",
      content: aiResponse,
      status: "sent",
      isFromTemplate: false,
    });

    // Log analytics event
    await logAnalyticsEvent({
      userId,
      conversationId: conversation.id,
      eventType: "message_sent",
      metadata: {
        messageType: "text",
        isAI: true,
      },
    });

    return {
      success: true,
      messageId: responseMsg,
      response: aiResponse,
    };
  } catch (error) {
    console.error("Error processing incoming message:", error);
    throw error;
  }
}

/**
 * Analyze message to qualify lead and update score
 */
async function qualifyLead(
  customerMessage: string,
  conversationId: number,
  userId: number,
  agent: any
): Promise<{ scoreIncrement: number; suggestedSegment?: string; isQualified?: boolean } | null> {
  try {
    const messages = await getMessagesByConversation(conversationId, 5);
    const conversationContext = messages
      .reverse()
      .map((msg) => `${msg.sender === "customer" ? "Customer" : "Agent"}: ${msg.content}`)
      .join("\n");

    const prompt = `Analyze the following WhatsApp conversation and determine the lead's intent and quality.
Conversation:
${conversationContext}

New Message: ${customerMessage}

Based on this, provide:
1. A score increment (integer between -5 and 10) based on intent (e.g., asking about pricing or booking is +10, saying "stop" is -5).
2. A suggested segment (e.g., "Hot Lead", "Interested", "Cold", "Support").
3. Whether the lead should be marked as "Qualified" (boolean).

Return ONLY a JSON object in this format:
{
  "scoreIncrement": number,
  "suggestedSegment": string,
  "isQualified": boolean
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a sales qualification assistant. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      provider: {
        type: (agent?.aiProvider as any) || "gemini",
        model: agent?.aiModel || undefined,
        apiKey: agent?.aiApiKey || undefined,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") return null;

    // Clean up potential markdown formatting
    const jsonStr = content.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error qualifying lead:", error);
    return null;
  }
}

/**
 * Generate AI response using LLM
 */
export async function generateAIResponse(
  customerMessage: string,
  agent: any,
  conversationId: number,
  userId: number
): Promise<string | null> {
  try {
    // Get conversation history for context
    const messages = await getMessagesByConversation(conversationId, 10);
    const reversedMessages = messages.reverse();

    // Build conversation context
    const conversationContext = reversedMessages
      .map((msg) => `${msg.sender === "customer" ? "Customer" : "Agent"}: ${msg.content}`)
      .join("\n");

    // Get relevant context from knowledge base
    const { getRelevantContext } = await import("./knowledge.service");
    const knowledgeContext = await getRelevantContext(userId, customerMessage);

    // Build system prompt
    const systemPrompt = `You are ${agent.agentName || "an AI Sales Agent"}. 
${agent.personality || "You are professional, friendly, and focused on helping customers."}

Sales Approach:
${agent.salesScript || "Focus on understanding customer needs and providing helpful solutions."}

${knowledgeContext ? `Knowledge Base Context (Use this to answer customer questions accurately):\n${knowledgeContext}\n` : ""}

Response Style: ${agent.responseStyle || "professional"}
Max Response Length: ${agent.maxResponseLength || 500} characters

Keep responses concise, helpful, and focused on the customer's needs.`;

    // Call LLM
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Previous conversation:\n${conversationContext}\n\nNew customer message: ${customerMessage}`,
        },
      ],
      provider: {
        type: (agent.aiProvider as any) || "gemini",
        model: agent.aiModel || undefined,
        apiKey: agent.aiApiKey || undefined,
      },
    });

    const content = response.choices[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.error("No response from LLM");
      return null;
    }

    // Truncate if too long
    const maxLength = agent.maxResponseLength || 500;
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + "...";
    }

    return content;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return null;
  }
}

/**
 * Check if message contains escalation keywords
 */
function checkEscalationKeywords(message: string, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;

  const lowerMessage = message.toLowerCase();
  return keywords.some((keyword) => lowerMessage.includes(keyword.toLowerCase()));
}

/**
 * Send WhatsApp message via Meta API
 */
export async function sendWhatsAppMessage(
  userId: number,
  phoneNumber: string,
  content: string,
  options: {
    type?: "text" | "image" | "document" | "audio" | "video" | "template" | "interactive";
    mediaUrl?: string;
    templateName?: string;
    languageCode?: string;
    interactiveData?: any;
    configId?: number;
  } = {},
  retryCount = 0
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { getWhatsappConfigById } = await import("./whatsapp.db");
    const config = options.configId ? await getWhatsappConfigById(options.configId) : await getWhatsappConfig(userId);
    if (!config) {
      return { success: false, error: "WhatsApp config not found" };
    }

    const type = options.type || "text";
    let body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type,
    };

    if (type === "text") {
      body.text = { body: content };
    } else if (type === "template") {
      body.template = {
        name: options.templateName,
        language: { code: options.languageCode || "en_US" },
      };
    } else if (type === "interactive") {
      body.interactive = options.interactiveData;
    } else {
      // Media types
      body[type] = { link: options.mediaUrl };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.businessPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = (await response.json()) as any;

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      
      // Retry logic for transient errors (e.g., rate limits or temporary server issues)
      if (retryCount < 3 && (response.status === 429 || response.status >= 500)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying message send in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return sendWhatsAppMessage(userId, phoneNumber, content, options, retryCount + 1);
      }

      return { success: false, error: data.error?.message || "Failed to send message" };
    }

    return {
      success: true,
      messageId: data.messages[0]?.id,
    };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendWhatsAppMessage(userId, phoneNumber, content, options, retryCount + 1);
    }

    return { success: false, error: String(error) };
  }
}

/**
 * Mark a message as read in WhatsApp
 */
export async function markMessageAsRead(userId: number, whatsappMessageId: string) {
  try {
    const db = await import("./whatsapp.db");
    
    // Find the message to get its configId
    const messages = await db.getMessagesByWhatsappId(whatsappMessageId);
    if (messages.length === 0) {
      console.error(`Message ${whatsappMessageId} not found in database for marking as read`);
      return { success: false, error: "Message not found" };
    }
    
    const message = messages[0];
    if (!message.configId) {
      console.error(`Message ${whatsappMessageId} has no configId`);
      return { success: false, error: "Config ID not found for message" };
    }

    const config = await db.getWhatsappConfigById(message.configId);
    if (!config) {
      console.error(`WhatsApp config ${message.configId} not found for message ${whatsappMessageId}`);
      return { success: false, error: "WhatsApp config not found" };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.businessPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: whatsappMessageId,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Error marking message as read in WhatsApp:", data);
      return { success: false, error: data.error?.message || "Failed to mark as read" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markMessageAsRead:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle message status update from Meta
 */
export async function handleMessageStatusUpdate(
  userId: number,
  whatsappMessageId: string,
  status: string
) {
  try {
    const db = await import("./whatsapp.db");
    
    // Find message in database by whatsappMessageId
    const messages = await db.getMessagesByWhatsappId(whatsappMessageId);
    if (messages.length > 0) {
      const message = messages[0];
      await db.updateMessageStatus(message.id, status);
      console.log(`Message ${whatsappMessageId} status updated to ${status} in database`);
    } else {
      console.log(`Message ${whatsappMessageId} not found in database for status update`);
    }

    // Also update broadcast recipient status if applicable
    await db.updateRecipientStatusByMessageId(whatsappMessageId, status);

    // Log analytics event
    await db.logAnalyticsEvent({
      userId,
      eventType: "message_status_updated",
      metadata: {
        whatsappMessageId,
        status,
      },
    });
  } catch (error) {
    console.error("Error handling message status update:", error);
  }
}
