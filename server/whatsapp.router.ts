import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getWhatsappConfig,
  upsertWhatsappConfig,
  getContactsByUserId,
  getContactById,
  updateContact,
  createContact,
  deleteContact,
  getContactHistory,
  getConversationsByUserId,
  getConversationWithMessages,
  createMessage,
  getAgentConfig,
  upsertAgentConfig,
  getTemplatesByUserId,
  createTemplate,
  getNotificationsByUserId,
  markNotificationAsRead,
  getExternalWebhooks,
  createExternalWebhook,
  deleteExternalWebhook,
  getMessagesByConversation,
  getBroadcastsByUserId,
  getBroadcastDetail,
  createBroadcast,
  updateBroadcastStatus,
  updateRecipientStatus,
  createScheduledMessage,
  getScheduledMessagesByUserId,
  cancelScheduledMessage,
  getWhatsappConfigs,
  deleteWhatsappConfig,
} from "./whatsapp.db";
import { sendWhatsAppMessage, generateAIResponse, processIncomingMessage, markMessageAsRead } from "./whatsapp.webhook";
import { checkWebhookStatus, validateWebhookConfig } from "./whatsapp.status";
import { invokeLLM } from "./_core/llm";

export const whatsappRouter = router({
  // WhatsApp Configuration
  getConfigs: protectedProcedure.query(async ({ ctx }) => {
    return await getWhatsappConfigs(ctx.user.id);
  }),

  getConfig: protectedProcedure.query(async ({ ctx }) => {
    return await getWhatsappConfig(ctx.user.id);
  }),

  updateConfig: protectedProcedure
    .input(
      z.object({
        businessPhoneNumberId: z.string(),
        businessAccountId: z.string(),
        accessToken: z.string(),
        webhookVerifyToken: z.string(),
        nickname: z.string().optional(),
        phoneNumber: z.string().optional(),
        connectionMethod: z.enum(["cloud_api", "coexistence"]).default("cloud_api"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertWhatsappConfig({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  deleteConfig: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteWhatsappConfig(ctx.user.id, input.configId);
    }),

  // Contacts
  getContacts: protectedProcedure.query(async ({ ctx }) => {
    return await getContactsByUserId(ctx.user.id);
  }),

  getContactDetail: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ ctx, input }) => {
      const contact = await getContactById(ctx.user.id, input.contactId);
      if (!contact) throw new Error("Contact not found");
      return contact;
    }),

  updateContact: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        displayName: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        tags: z.array(z.string()).optional(),
        segment: z.string().optional(),
        leadScore: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { contactId, ...data } = input;
      await updateContact(ctx.user.id, contactId, data);
      return { success: true };
    }),

  createContact: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        displayName: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        tags: z.array(z.string()).optional(),
        segment: z.string().optional(),
        leadScore: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createContact(ctx.user.id, input as any);
    }),

  deleteContact: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteContact(ctx.user.id, input.contactId);
      return { success: true };
    }),

  getContactHistory: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getContactHistory(ctx.user.id, input.contactId);
    }),

  // Conversations
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return await getConversationsByUserId(ctx.user.id);
  }),

  getOrCreateConversation: protectedProcedure
    .input(z.object({ contactId: z.number(), phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { getOrCreateConversation } = await import("./whatsapp.db");
      return await getOrCreateConversation(ctx.user.id, input.contactId, input.phoneNumber);
    }),

  getConversationDetail: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const data = await getConversationWithMessages(input.conversationId);
      if (!data) return null;

      // Verify ownership
      if (data.conversation.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return data;
    }),

  toggleHumanAgent: protectedProcedure
    .input(z.object({ conversationId: z.number(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { updateConversation } = await import("./whatsapp.db");
      await updateConversation(input.conversationId, { 
        humanAgentActive: input.active,
        status: input.active ? "escalated" : "active"
      });
      return { success: true };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        phoneNumber: z.string(),
        message: z.string(),
        type: z.enum(["text", "image", "document", "audio", "video", "template", "interactive"]).optional(),
        mediaUrl: z.string().optional(),
        templateName: z.string().optional(),
        languageCode: z.string().optional(),
        interactiveData: z.any().optional(),
        configId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Send via WhatsApp
      const result = await sendWhatsAppMessage(ctx.user.id, input.phoneNumber, input.message, {
        type: input.type as any,
        mediaUrl: input.mediaUrl,
        templateName: input.templateName,
        languageCode: input.languageCode,
        interactiveData: input.interactiveData,
        configId: input.configId,
      });

      // Store message in database
      await createMessage({
        userId: ctx.user.id,
        configId: input.configId,
        conversationId: input.conversationId,
        whatsappMessageId: result.messageId,
        sender: "human",
        messageType: (input.type || "text") as any,
        content: input.message,
        interactiveData: input.interactiveData,
        mediaUrl: input.mediaUrl,
        isFromTemplate: input.type === "template",
        templateName: input.templateName,
        status: result.success ? "sent" : "failed",
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    }),

  // Agent Configuration
  getAgentConfig: protectedProcedure.query(async ({ ctx }) => {
    return await getAgentConfig(ctx.user.id);
  }),

  updateAgentConfig: protectedProcedure
    .input(
      z.object({
        agentName: z.string().optional(),
        personality: z.string().optional(),
        salesScript: z.string().optional(),
        responseStyle: z.enum(["professional", "casual", "friendly"]).optional(),
        maxResponseLength: z.number().optional(),
        isActive: z.boolean().optional(),
        autoRespond: z.boolean().optional(),
        aiProvider: z.enum(["gemini", "openrouter", "openai", "anthropic"]).optional(),
        aiModel: z.string().optional(),
        aiApiKey: z.string().optional(),
        escalationKeywords: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertAgentConfig({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  // Response Templates
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return await getTemplatesByUserId(ctx.user.id);
  }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        category: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createTemplate({
        userId: ctx.user.id,
        ...input,
        isActive: true,
      });
      return { success: true };
    }),

  // Notifications
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await getNotificationsByUserId(ctx.user.id);
  }),

  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  // Webhook Status
  checkWebhookStatus: protectedProcedure.query(async ({ ctx }) => {
    return await checkWebhookStatus(ctx.user.id);
  }),

  validateWebhookConfig: protectedProcedure
    .input(
      z.object({
        businessPhoneNumberId: z.string().optional(),
        accessToken: z.string().optional(),
        webhookVerifyToken: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return validateWebhookConfig(
        input.businessPhoneNumberId,
        input.accessToken,
        input.webhookVerifyToken
      );
    }),

  // External Webhooks (Integrations)
  getExternalWebhooks: protectedProcedure.query(async ({ ctx }) => {
    return await getExternalWebhooks(ctx.user.id);
  }),

  createExternalWebhook: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        url: z.string().url(),
        secret: z.string().optional(),
        events: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createExternalWebhook({
        userId: ctx.user.id,
        ...input,
      });
    }),

  deleteExternalWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteExternalWebhook(ctx.user.id, input.webhookId);
    }),

  // AI Smart Suggestions
  getSmartSuggestion: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const agent = await getAgentConfig(ctx.user.id);
      if (!agent) return null;

      // Get last customer message
      const messages = await getMessagesByConversation(input.conversationId, 5);
      const lastCustomerMsg = messages.find(m => m.sender === "customer");
      
      if (!lastCustomerMsg) return null;

      const suggestion = await generateAIResponse(
        lastCustomerMsg.content,
        {
          ...agent,
          personality: (agent.personality || "") + "\nProvide a helpful suggestion for a human agent to send. Keep it brief.",
        },
        input.conversationId,
        ctx.user.id
      );

      return suggestion;
    }),

  // Testing / Simulation
  simulateIncomingMessage: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = await getWhatsappConfig(ctx.user.id);
      if (!config) throw new Error("WhatsApp config not found. Please configure your credentials first.");

      await processIncomingMessage(
        ctx.user.id,
        {
          from: input.from,
          id: "sim_" + Math.random().toString(36).substring(2, 11),
          timestamp: Math.floor(Date.now() / 1000).toString(),
          type: "text",
          text: { body: input.message },
        },
        config.businessPhoneNumberId
      );

      return { success: true };
    }),

  markConversationAsRead: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const messages = await getMessagesByConversation(input.conversationId, 10);
      const unreadCustomerMessages = messages.filter(
        (m) => m.sender === "customer" && m.status !== "read" && m.whatsappMessageId
      );

      for (const msg of unreadCustomerMessages) {
        if (msg.whatsappMessageId) {
          await markMessageAsRead(ctx.user.id, msg.whatsappMessageId);
        }
      }

      return { success: true };
    }),

  previewAgentResponse: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        agentName: z.string(),
        personality: z.string(),
        salesScript: z.string(),
        responseStyle: z.string(),
        aiProvider: z.enum(["gemini", "openrouter", "openai", "anthropic"]),
        aiModel: z.string(),
        aiApiKey: z.string().optional(),
        history: z.array(z.object({ role: z.enum(["user", "model"]), content: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const systemPrompt = `You are ${input.agentName || "an AI Sales Agent"}. 
Personality: ${input.personality || "Professional and helpful."}
Sales Script/Approach: ${input.salesScript || "Focus on customer needs."}
Response Style: ${input.responseStyle}

Keep your responses concise and focused on the conversation.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.history.map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as any,
          content: m.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      const response = await invokeLLM({
        messages,
        provider: {
          type: input.aiProvider,
          model: input.aiModel,
          apiKey: input.aiApiKey,
        },
      });

      return response.choices[0]?.message?.content || "No response generated";
    }),

  // Broadcast Campaigns
  getBroadcasts: protectedProcedure.query(async ({ ctx }) => {
    return await getBroadcastsByUserId(ctx.user.id);
  }),

  getBroadcastDetail: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const data = await getBroadcastDetail(input.campaignId);
      if (!data) return null;
      if (data.campaign.userId !== ctx.user.id) throw new Error("Unauthorized");
      return data;
    }),

  createBroadcast: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        content: z.string(),
        contactIds: z.array(z.number()),
        configId: z.number().optional(),
        isTemplate: z.boolean().optional(),
        templateName: z.string().optional(),
        languageCode: z.string().optional(),
        retargetFromId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, content, contactIds, configId, isTemplate, templateName, languageCode, retargetFromId } = input;
      return await createBroadcast(
        {
          userId: ctx.user.id,
          configId,
          name,
          content,
          status: "draft",
          isTemplate,
          templateName,
          languageCode,
          retargetFromId,
        },
        contactIds
      );
    }),

  sendBroadcast: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const data = await getBroadcastDetail(input.campaignId);
      if (!data) throw new Error("Campaign not found");
      if (data.campaign.userId !== ctx.user.id) throw new Error("Unauthorized");

      // Update status to sending
      await updateBroadcastStatus(input.campaignId, "sending");

      // Process recipients
      let sentCount = 0;
      for (const recipient of data.recipients) {
        if (recipient.status !== "pending") continue;

        const contact = await getContactById(ctx.user.id, recipient.contactId);
        if (!contact) {
          await updateRecipientStatus(recipient.id, "failed", undefined, "Contact not found");
          continue;
        }

        const result = await sendWhatsAppMessage(
          ctx.user.id, 
          contact.phoneNumber, 
          data.campaign.content,
          {
            configId: data.campaign.configId || undefined,
            type: data.campaign.isTemplate ? "template" : "text",
            templateName: data.campaign.templateName || undefined,
            languageCode: data.campaign.languageCode || undefined,
          }
        );
        
        if (result.success) {
          await updateRecipientStatus(recipient.id, "sent", result.messageId);
          sentCount++;
        } else {
          await updateRecipientStatus(recipient.id, "failed", undefined, result.error);
        }
      }

      const { updateBroadcastStats } = await import("./whatsapp.db");
      await updateBroadcastStats(input.campaignId);
      await updateBroadcastStatus(input.campaignId, "completed", sentCount);
      
      return { success: true, sentCount };
    }),

  // Scheduled Messages
  getScheduledMessages: protectedProcedure
    .input(z.object({ contactId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await getScheduledMessagesByUserId(ctx.user.id, input.contactId);
    }),

  scheduleMessage: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        content: z.string(),
        scheduledAt: z.string(), // ISO string
        type: z.enum(["text", "interactive"]).default("text"),
        interactiveData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createScheduledMessage({
        userId: ctx.user.id,
        contactId: input.contactId,
        content: input.content,
        scheduledAt: new Date(input.scheduledAt),
        messageType: input.type,
        interactiveData: input.interactiveData,
        status: "pending",
      });
    }),

  cancelScheduledMessage: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await cancelScheduledMessage(ctx.user.id, input.messageId);
      return { success: true };
    }),
});
