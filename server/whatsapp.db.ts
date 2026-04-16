import { eq, and, desc, asc } from "drizzle-orm";
import {
  whatsappConfig,
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
  agentConfig,
  responseTemplates,
  analyticsEvents,
  notifications,
  externalWebhooks,
  broadcastCampaigns,
  broadcastRecipients,
  scheduledMessages,
  type InsertWhatsappContact,
  type InsertWhatsappConversation,
  type InsertWhatsappMessage,
  type InsertAgentConfig,
  type InsertResponseTemplate,
  type InsertAnalyticsEvent,
  type InsertNotification,
  type InsertExternalWebhook,
  type InsertBroadcastCampaign,
  type InsertBroadcastRecipient,
  type InsertScheduledMessage,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * WhatsApp Configuration
 */
export async function getWhatsappConfigs(userId: number) {
  try {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(whatsappConfig)
      .where(eq(whatsappConfig.userId, userId))
      .orderBy(desc(whatsappConfig.createdAt));
  } catch (error) {
    console.error("[Database] Error in getWhatsappConfigs:", error);
    return [];
  }
}

export async function getWhatsappConfig(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Database] Cannot get WhatsApp config: database not available");
      return null;
    }

    const result = await db
      .select()
      .from(whatsappConfig)
      .where(and(eq(whatsappConfig.userId, userId), eq(whatsappConfig.isActive, true)))
      .orderBy(desc(whatsappConfig.updatedAt))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error in getWhatsappConfig:", error);
    return null;
  }
}

export async function getWhatsappConfigById(configId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(whatsappConfig)
      .where(eq(whatsappConfig.id, configId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error in getWhatsappConfigById:", error);
    return null;
  }
}

export async function getWhatsappConfigByPhoneId(businessPhoneNumberId: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(whatsappConfig)
      .where(eq(whatsappConfig.businessPhoneNumberId, businessPhoneNumberId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error in getWhatsappConfigByPhoneId:", error);
    return null;
  }
}

export async function upsertWhatsappConfig(config: {
  userId: number;
  businessPhoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  nickname?: string;
  phoneNumber?: string;
  connectionMethod?: "cloud_api" | "coexistence";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(whatsappConfig)
    .where(eq(whatsappConfig.businessPhoneNumberId, config.businessPhoneNumberId))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(whatsappConfig)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(whatsappConfig.businessPhoneNumberId, config.businessPhoneNumberId));
  }

  return await db.insert(whatsappConfig).values(config);
}

export async function deleteWhatsappConfig(userId: number, configId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(whatsappConfig)
    .where(and(eq(whatsappConfig.userId, userId), eq(whatsappConfig.id, configId)));
}

/**
 * WhatsApp Contacts
 */
export async function getOrCreateContact(userId: number, phoneNumber: string, displayName?: string, configId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(whatsappContacts)
    .where(
      and(
        eq(whatsappContacts.userId, userId),
        eq(whatsappContacts.phoneNumber, phoneNumber)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const contact = existing[0];
    const updates: Partial<InsertWhatsappContact> = {};
    
    // Update configId if provided and not set
    if (configId && !contact.configId) {
      updates.configId = configId;
    }

    // Update displayName if we have a better one now (e.g. from Meta profile)
    // and the current one is just the phone number
    if (displayName && displayName !== phoneNumber && contact.displayName === phoneNumber) {
      updates.displayName = displayName;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(whatsappContacts).set(updates).where(eq(whatsappContacts.id, contact.id));
      return { ...contact, ...updates };
    }

    return contact;
  }

  const newContact: InsertWhatsappContact = {
    userId,
    configId,
    phoneNumber,
    displayName: displayName || phoneNumber,
  };

  await db.insert(whatsappContacts).values(newContact);

  const created = await db
    .select()
    .from(whatsappContacts)
    .where(
      and(
        eq(whatsappContacts.userId, userId),
        eq(whatsappContacts.phoneNumber, phoneNumber)
      )
    )
    .limit(1);

  return created[0];
}

export async function getContactsByUserId(userId: number, limit_count = 50) {
  try {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(whatsappContacts)
      .where(eq(whatsappContacts.userId, userId))
      .orderBy(desc(whatsappContacts.lastMessageAt))
      .limit(limit_count);
  } catch (error) {
    console.error("[Database] Error in getContactsByUserId:", error);
    return [];
  }
}

export async function getContactById(userId: number, contactId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(whatsappContacts)
    .where(and(eq(whatsappContacts.userId, userId), eq(whatsappContacts.id, contactId)))
    .limit(1);

  return result[0] || null;
}

export async function updateContact(userId: number, contactId: number, data: Partial<InsertWhatsappContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(whatsappContacts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(whatsappContacts.userId, userId), eq(whatsappContacts.id, contactId)));
}

export async function createContact(userId: number, data: InsertWhatsappContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappContacts).values({ ...data, userId }).returning();
  return result[0];
}

export async function deleteContact(userId: number, contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(whatsappContacts)
    .where(and(eq(whatsappContacts.userId, userId), eq(whatsappContacts.id, contactId)));
}

export async function getContactHistory(userId: number, contactId: number, limit_count = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.contactId, contactId)))
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(limit_count);
}

/**
 * WhatsApp Conversations
 */
export async function getOrCreateConversation(
  userId: number,
  contactId: number,
  whatsappContactId: string,
  configId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.userId, userId),
        eq(whatsappConversations.contactId, contactId),
        configId ? eq(whatsappConversations.configId, configId) : undefined
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const newConversation: InsertWhatsappConversation = {
    userId,
    contactId,
    configId,
    whatsappContactId,
  };

  await db.insert(whatsappConversations).values(newConversation);

  const created = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.userId, userId),
        eq(whatsappConversations.contactId, contactId)
      )
    )
    .limit(1);

  return created[0];
}

export async function updateConversation(conversationId: number, data: Partial<InsertWhatsappConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(whatsappConversations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(whatsappConversations.id, conversationId));
}

export async function getConversationsByUserId(userId: number, limit_count = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: whatsappConversations.id,
      userId: whatsappConversations.userId,
      configId: whatsappConversations.configId,
      contactId: whatsappConversations.contactId,
      whatsappContactId: whatsappConversations.whatsappContactId,
      status: whatsappConversations.status,
      lastMessageAt: whatsappConversations.lastMessageAt,
      messageCount: whatsappConversations.messageCount,
      aiMessageCount: whatsappConversations.aiMessageCount,
      averageResponseTime: whatsappConversations.averageResponseTime,
      leadQualified: whatsappConversations.leadQualified,
      humanAgentActive: whatsappConversations.humanAgentActive,
      configNickname: whatsappConfig.nickname,
      configPhoneNumber: whatsappConfig.phoneNumber,
      contactDisplayName: whatsappContacts.displayName,
    })
    .from(whatsappConversations)
    .leftJoin(whatsappConfig, eq(whatsappConversations.configId, whatsappConfig.id))
    .leftJoin(whatsappContacts, eq(whatsappConversations.contactId, whatsappContacts.id))
    .where(eq(whatsappConversations.userId, userId))
    .orderBy(desc(whatsappConversations.lastMessageAt))
    .limit(limit_count);
}

export async function getConversationWithMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return null;

  const conversation = await db
    .select({
      conversation: whatsappConversations,
      config: whatsappConfig,
      contact: whatsappContacts,
    })
    .from(whatsappConversations)
    .leftJoin(whatsappConfig, eq(whatsappConversations.configId, whatsappConfig.id))
    .leftJoin(whatsappContacts, eq(whatsappConversations.contactId, whatsappContacts.id))
    .where(eq(whatsappConversations.id, conversationId))
    .limit(1);

  if (!conversation.length) return null;

  const messages = await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(asc(whatsappMessages.createdAt));

  return {
    conversation: conversation[0].conversation,
    config: conversation[0].config,
    contact: conversation[0].contact,
    messages,
  };
}

/**
 * WhatsApp Messages
 */
export async function createMessage(message: InsertWhatsappMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappMessages).values(message).returning();
  return result[0].id;
}

export async function getMessagesByConversation(conversationId: number, limit_count = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(asc(whatsappMessages.createdAt))
    .limit(limit_count);
}

export async function getMessagesByWhatsappId(whatsappMessageId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.whatsappMessageId, whatsappMessageId))
    .limit(1);
}

export async function updateMessageStatus(messageId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(whatsappMessages)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(whatsappMessages.id, messageId));
}

/**
 * Agent Configuration
 */
export async function getAgentConfig(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error in getAgentConfig:", error);
    return null;
  }
}

export async function upsertAgentConfig(config: InsertAgentConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(agentConfig)
    .where(eq(agentConfig.userId, config.userId!))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(agentConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(agentConfig.userId, config.userId!));
  }

  return await db.insert(agentConfig).values(config);
}

/**
 * Response Templates
 */
export async function getTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(responseTemplates)
    .where(and(eq(responseTemplates.userId, userId), eq(responseTemplates.isActive, true)))
    .orderBy(responseTemplates.category);
}

export async function createTemplate(template: InsertResponseTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(responseTemplates).values(template);
}

/**
 * Analytics Events
 */
export async function logAnalyticsEvent(event: InsertAnalyticsEvent) {
  const db = await getDb();
  if (!db) return null;

  return await db.insert(analyticsEvents).values(event);
}

/**
 * Notifications
 */
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;

  return await db.insert(notifications).values(notification);
}

export async function getNotificationsByUserId(userId: number, limit_count = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit_count);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

/**
 * External Webhooks
 */
export async function getExternalWebhooks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(externalWebhooks)
    .where(eq(externalWebhooks.userId, userId));
}

export async function createExternalWebhook(webhook: InsertExternalWebhook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(externalWebhooks).values(webhook);
}

export async function deleteExternalWebhook(userId: number, webhookId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(externalWebhooks)
    .where(and(eq(externalWebhooks.userId, userId), eq(externalWebhooks.id, webhookId)));
}

/**
 * Broadcast Campaigns
 */
export async function getBroadcastsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.userId, userId))
    .orderBy(desc(broadcastCampaigns.createdAt));
}

export async function getBroadcastDetail(campaignId: number) {
  const db = await getDb();
  if (!db) return null;

  const campaign = await db
    .select()
    .from(broadcastCampaigns)
    .where(eq(broadcastCampaigns.id, campaignId))
    .limit(1);

  if (!campaign.length) return null;

  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, campaignId));

  return {
    campaign: campaign[0],
    recipients,
  };
}

export async function createBroadcast(campaign: InsertBroadcastCampaign, contactIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(broadcastCampaigns).values(campaign).returning();
  const campaignId = result[0].id;

  if (contactIds.length > 0) {
    const recipients: InsertBroadcastRecipient[] = contactIds.map((contactId) => ({
      campaignId,
      contactId,
      status: "pending",
    }));

    await db.insert(broadcastRecipients).values(recipients);
    await db
      .update(broadcastCampaigns)
      .set({ totalCount: contactIds.length })
      .where(eq(broadcastCampaigns.id, campaignId));
  }

  return result[0];
}

export async function updateBroadcastStats(campaignId: number) {
  const db = await getDb();
  if (!db) return;

  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.campaignId, campaignId));

  const sentCount = recipients.filter(r => r.status === "sent" || r.status === "delivered" || r.status === "read").length;
  const deliveredCount = recipients.filter(r => r.status === "delivered" || r.status === "read").length;
  const readCount = recipients.filter(r => r.status === "read").length;

  await db
    .update(broadcastCampaigns)
    .set({ 
      sentCount, 
      deliveredCount, 
      readCount,
      updatedAt: new Date() 
    })
    .where(eq(broadcastCampaigns.id, campaignId));
}

export async function updateRecipientStatusByMessageId(whatsappMessageId: string, status: string) {
  const db = await getDb();
  if (!db) return;

  const recipients = await db
    .select()
    .from(broadcastRecipients)
    .where(eq(broadcastRecipients.whatsappMessageId, whatsappMessageId))
    .limit(1);

  if (recipients.length > 0) {
    const recipient = recipients[0];
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === "delivered") updateData.deliveredAt = new Date();
    if (status === "read") updateData.readAt = new Date();

    await db
      .update(broadcastRecipients)
      .set(updateData)
      .where(eq(broadcastRecipients.id, recipient.id));

    // Update campaign stats
    await updateBroadcastStats(recipient.campaignId);
  }
}

export async function updateBroadcastStatus(campaignId: number, status: "draft" | "sending" | "completed" | "failed", sentCount?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status, updatedAt: new Date() };
  if (sentCount !== undefined) {
    updateData.sentCount = sentCount;
  }

  return await db
    .update(broadcastCampaigns)
    .set(updateData)
    .where(eq(broadcastCampaigns.id, campaignId));
}

export async function updateRecipientStatus(recipientId: number, status: "sent" | "delivered" | "read" | "failed", whatsappMessageId?: string, error?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status, error, updatedAt: new Date() };
  if (whatsappMessageId) updateData.whatsappMessageId = whatsappMessageId;
  if (status === "sent") updateData.sentAt = new Date();
  if (status === "delivered") updateData.deliveredAt = new Date();
  if (status === "read") updateData.readAt = new Date();

  return await db
    .update(broadcastRecipients)
    .set(updateData)
    .where(eq(broadcastRecipients.id, recipientId));
}

/**
 * Scheduled Messages
 */
export async function createScheduledMessage(message: InsertScheduledMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scheduledMessages).values(message).returning();
  return result[0];
}

export async function getScheduledMessagesByUserId(userId: number, contactId?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(scheduledMessages)
    .where(eq(scheduledMessages.userId, userId));

  if (contactId) {
    query = db
      .select()
      .from(scheduledMessages)
      .where(and(eq(scheduledMessages.userId, userId), eq(scheduledMessages.contactId, contactId)));
  }

  return await query.orderBy(asc(scheduledMessages.scheduledAt));
}

export async function getPendingScheduledMessages() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(scheduledMessages)
    .where(and(eq(scheduledMessages.status, "pending"), eq(scheduledMessages.scheduledAt, now)));
}

export async function updateScheduledMessageStatus(messageId: number, status: "sent" | "failed" | "cancelled", error?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(scheduledMessages)
    .set({ status, error, updatedAt: new Date() })
    .where(eq(scheduledMessages.id, messageId));
}

export async function cancelScheduledMessage(userId: number, messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(scheduledMessages)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(scheduledMessages.userId, userId), eq(scheduledMessages.id, messageId)));
}
