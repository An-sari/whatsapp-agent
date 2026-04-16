import { GoogleGenAI } from "@google/genai";
import {
  getActiveNurtureStatesDue,
  getStepsBySequenceId,
  updateNurtureState,
  getNurtureSequencesByUserId,
} from "./nurture.db";
import {
  getWhatsappConfig,
  getAgentConfig,
  createMessage,
  getMessagesByConversation,
  getOrCreateConversation,
} from "./whatsapp.db";
import { sendWhatsAppMessage } from "./whatsapp.webhook";
import { getRelevantContext } from "./knowledge.service";

/**
 * Main Nurture Engine Loop
 * Should be called periodically (e.g., every 15-30 minutes)
 */
export async function runNurtureEngine() {
  console.log("[Nurture Engine] Starting check for due follow-ups...");
  
  let retries = 3;
  let success = false;
  
  while (retries > 0 && !success) {
    try {
      const dueStates = await getActiveNurtureStatesDue();
      console.log(`[Nurture Engine] Found ${dueStates.length} contacts due for follow-up.`);
  
      for (const state of dueStates) {
        await processNurtureStep(state);
      }
      success = true;
    } catch (error) {
      retries--;
      console.error(`[Nurture Engine] Error in nurture engine loop (Retries left: ${retries}):`, error);
      if (retries > 0) {
        // Wait 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

/**
 * Process a single nurture step for a contact
 */
async function processNurtureStep(state: any) {
  try {
    const steps = await getStepsBySequenceId(state.sequenceId);
    
    // Find next step
    let nextStepIndex = 0;
    if (state.currentStepId) {
      const currentStepIndex = steps.findIndex((s) => s.id === state.currentStepId);
      nextStepIndex = currentStepIndex + 1;
    }

    const nextStep = steps[nextStepIndex];

    if (!nextStep) {
      // Sequence completed
      await updateNurtureState(state.id, {
        status: "completed",
        updatedAt: new Date(),
      });
      console.log(`[Nurture Engine] Sequence ${state.sequenceId} completed for contact ${state.contactId}`);
      return;
    }

    // Send the follow-up
    const success = await sendFollowUp(state.userId, state.contactId, nextStep);

    if (success) {
      // Update state for next step
      const nextRunAt = new Date();
      const followingStep = steps[nextStepIndex + 1];
      
      if (followingStep) {
        nextRunAt.setHours(nextRunAt.getHours() + followingStep.delayHours);
      } else {
        // No more steps, but we'll mark it as completed in the next run or now
      }

      await updateNurtureState(state.id, {
        currentStepId: nextStep.id,
        lastRunAt: new Date(),
        nextRunAt: followingStep ? nextRunAt : null,
        status: followingStep ? "active" : "completed",
        updatedAt: new Date(),
      });
      
      console.log(`[Nurture Engine] Sent follow-up step ${nextStep.stepNumber} to contact ${state.contactId}`);
    } else {
      // If failed, we might want to retry later
      const retryAt = new Date();
      retryAt.setMinutes(retryAt.getMinutes() + 30);
      await updateNurtureState(state.id, {
        nextRunAt: retryAt,
        updatedAt: new Date(),
      });
      console.warn(`[Nurture Engine] Failed to send follow-up to contact ${state.contactId}, retrying in 30m`);
    }
  } catch (error) {
    console.error(`[Nurture Engine] Error processing nurture step for state ${state.id}:`, error);
  }
}

/**
 * Generate and send the follow-up message
 */
async function sendFollowUp(userId: number, contactId: number, step: any): Promise<boolean> {
  try {
    const db = await import("./whatsapp.db");
    const contact = await db.getContactById(userId, contactId);
    if (!contact) return false;

    const agent = await getAgentConfig(userId);
    if (!agent) return false;

    const conversation = await getOrCreateConversation(userId, contactId, contact.phoneNumber);
    if (!conversation) return false;

    let messageContent = step.content;

    // If it's an AI prompt, generate content using Gemini
    if (step.type === "ai_prompt") {
      messageContent = await generateNurtureMessage(userId, contact, agent, conversation.id, step.content);
    }

    if (!messageContent) return false;

    // Send via WhatsApp
    const result = await sendWhatsAppMessage(userId, contact.phoneNumber, messageContent);

    if (result.success) {
      // Store in DB
      await createMessage({
        userId,
        conversationId: conversation.id,
        sender: "agent",
        messageType: "text",
        content: messageContent,
        status: "sent",
        whatsappMessageId: result.messageId,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Nurture Engine] Error sending follow-up:", error);
    return false;
  }
}

/**
 * Generate a personalized nurture message using AI
 */
async function generateNurtureMessage(
  userId: number,
  contact: any,
  agent: any,
  conversationId: number,
  prompt: string
): Promise<string | null> {
  try {
    const messages = await getMessagesByConversation(conversationId, 10);
    const conversationContext = messages
      .reverse()
      .map((msg) => `${msg.sender === "customer" ? "Customer" : "Agent"}: ${msg.content}`)
      .join("\n");

    const knowledgeContext = await getRelevantContext(userId, "follow up context");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const model = "gemini-3-flash-preview";

    const systemInstruction = `You are ${agent.agentName || "an AI Sales Agent"}. 
Personality: ${agent.personality || "Professional and helpful."}
Goal: Send a polite follow-up message to a customer who hasn't responded.

Context from Knowledge Base:
${knowledgeContext}

Instructions for this follow-up:
${prompt}

Response Style: ${agent.responseStyle || "professional"}
Max Length: ${agent.maxResponseLength || 500} characters.

Keep it natural, friendly, and low-pressure. Don't sound like a bot.`;

    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Conversation history:\n${conversationContext}\n\nGenerate a follow-up message for this customer.` }],
        },
      ],
      config: {
        systemInstruction,
      },
    });

    return result.text || null;
  } catch (error) {
    console.error("[Nurture Engine] Error generating AI nurture message:", error);
    return null;
  }
}
