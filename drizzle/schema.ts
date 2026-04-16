import { pgTable, serial, text, timestamp, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * WhatsApp Business Account Configuration
 */
export const whatsappConfig = pgTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nickname: varchar("nickname", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  connectionMethod: text("connectionMethod").$type<"cloud_api" | "coexistence">().default("cloud_api").notNull(),
  businessPhoneNumberId: varchar("businessPhoneNumberId", { length: 255 }).notNull().unique(),
  businessAccountId: varchar("businessAccountId", { length: 255 }).notNull(),
  accessToken: text("accessToken").notNull(),
  webhookVerifyToken: varchar("webhookVerifyToken", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = typeof whatsappConfig.$inferInsert;

/**
 * WhatsApp Contacts
 */
export const whatsappContacts = pgTable("whatsapp_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  configId: integer("configId").references(() => whatsappConfig.id),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  segment: varchar("segment", { length: 100 }),
  leadScore: integer("leadScore").default(0),
  sentiment: text("sentiment").$type<"positive" | "neutral" | "negative">().default("neutral"),
  notes: text("notes"),
  isOnline: boolean("isOnline").default(false),
  lastSeenAt: timestamp("lastSeenAt"),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappContact = typeof whatsappContacts.$inferSelect;
export type InsertWhatsappContact = typeof whatsappContacts.$inferInsert;

/**
 * WhatsApp Conversations
 */
export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  configId: integer("configId").references(() => whatsappConfig.id),
  contactId: integer("contactId").notNull(),
  whatsappContactId: varchar("whatsappContactId", { length: 255 }).notNull(),
  status: text("status").$type<"active" | "closed" | "escalated">().default("active").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  messageCount: integer("messageCount").default(0),
  aiMessageCount: integer("aiMessageCount").default(0),
  humanMessageCount: integer("humanMessageCount").default(0),
  averageResponseTime: integer("averageResponseTime").default(0), // in seconds
  leadQualified: boolean("leadQualified").default(false),
  humanAgentActive: boolean("humanAgentActive").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;

/**
 * WhatsApp Messages
 */
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  configId: integer("configId").references(() => whatsappConfig.id),
  conversationId: integer("conversationId").notNull(),
  whatsappMessageId: varchar("whatsappMessageId", { length: 255 }).unique(),
  sender: text("sender").$type<"customer" | "agent" | "human">().notNull(),
  messageType: text("messageType").$type<"text" | "image" | "document" | "audio" | "video" | "template" | "interactive">().default("text").notNull(),
  content: text("content").notNull(),
  interactiveData: jsonb("interactiveData").$type<any>(),
  mediaUrl: varchar("mediaUrl", { length: 2048 }),
  status: text("status").$type<"sent" | "delivered" | "read" | "failed">().default("sent").notNull(),
  sentiment: text("sentiment").$type<"positive" | "neutral" | "negative">().default("neutral"),
  isFromTemplate: boolean("isFromTemplate").default(false),
  templateName: varchar("templateName", { length: 255 }),
  responseTime: integer("responseTime"), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

/**
 * AI Agent Configuration
 */
export const agentConfig = pgTable("agent_config", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  agentName: varchar("agentName", { length: 255 }).default("AI Sales Agent"),
  personality: text("personality"),
  salesScript: text("salesScript"),
  responseStyle: varchar("responseStyle", { length: 100 }).default("professional"),
  maxResponseLength: integer("maxResponseLength").default(500),
  isActive: boolean("isActive").default(true),
  autoRespond: boolean("autoRespond").default(true),
  aiProvider: text("aiProvider").$type<"gemini" | "openrouter" | "openai" | "anthropic">().default("gemini"),
  aiModel: text("aiModel").default("gemini-2.0-flash"),
  aiApiKey: text("aiApiKey"),
  escalationKeywords: jsonb("escalationKeywords").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AgentConfig = typeof agentConfig.$inferSelect;
export type InsertAgentConfig = typeof agentConfig.$inferInsert;

/**
 * Response Templates
 */
export const responseTemplates = pgTable("response_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  content: text("content").notNull(),
  isActive: boolean("isActive").default(true),
  usageCount: integer("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;

/**
 * Analytics Events
 */
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  conversationId: integer("conversationId"),
  contactId: integer("contactId"),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Notifications
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  conversationId: integer("conversationId"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: text("type").$type<"lead" | "escalation" | "error" | "info">().default("info").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Knowledge Base Documents
 */
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").$type<"file" | "url">().notNull(),
  source: text("source").notNull(), // File path or URL
  content: text("content"), // Extracted text content
  status: text("status").$type<"processing" | "completed" | "failed">().default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

/**
 * Knowledge Chunks for Vector Search
 */
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: integer("documentId").notNull().references(() => knowledgeBase.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: text("embedding"), // We'll store as string or use pgvector if available. For now, let's use text and we can cast it.
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;

/**
 * Nurture Sequences
 */
export const nurtureSequences = pgTable("nurture_sequences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NurtureSequence = typeof nurtureSequences.$inferSelect;
export type InsertNurtureSequence = typeof nurtureSequences.$inferInsert;

/**
 * Nurture Steps
 */
export const nurtureSteps = pgTable("nurture_steps", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequenceId").notNull().references(() => nurtureSequences.id, { onDelete: "cascade" }),
  stepNumber: integer("stepNumber").notNull(),
  delayHours: integer("delayHours").notNull(), // Delay from previous step or start
  content: text("content").notNull(), // The message or prompt for AI
  type: text("type").$type<"text" | "ai_prompt">().default("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NurtureStep = typeof nurtureSteps.$inferSelect;
export type InsertNurtureStep = typeof nurtureSteps.$inferInsert;

/**
 * Contact Nurture State
 */
export const contactNurtureState = pgTable("contact_nurture_state", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactId: integer("contactId").notNull().references(() => whatsappContacts.id, { onDelete: "cascade" }),
  sequenceId: integer("sequenceId").notNull().references(() => nurtureSequences.id, { onDelete: "cascade" }),
  currentStepId: integer("currentStepId").references(() => nurtureSteps.id, { onDelete: "set null" }),
  status: text("status").$type<"active" | "paused" | "completed" | "stopped">().default("active").notNull(),
  nextRunAt: timestamp("nextRunAt"),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ContactNurtureState = typeof contactNurtureState.$inferSelect;
export type InsertContactNurtureState = typeof contactNurtureState.$inferInsert;

/**
 * External Webhooks for Integrations
 */
export const externalWebhooks = pgTable("external_webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  secret: varchar("secret", { length: 255 }),
  events: jsonb("events").$type<string[]>().default(["message_received", "lead_qualified", "escalation_triggered"]),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ExternalWebhook = typeof externalWebhooks.$inferSelect;
export type InsertExternalWebhook = typeof externalWebhooks.$inferInsert;

/**
 * Broadcast Campaigns
 */
export const broadcastCampaigns = pgTable("broadcast_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  configId: integer("configId").references(() => whatsappConfig.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: text("status").$type<"draft" | "sending" | "completed" | "failed">().default("draft").notNull(),
  isTemplate: boolean("isTemplate").default(false),
  templateName: varchar("templateName", { length: 255 }),
  languageCode: varchar("languageCode", { length: 10 }).default("en_US"),
  scheduledAt: timestamp("scheduledAt"),
  sentCount: integer("sentCount").default(0),
  deliveredCount: integer("deliveredCount").default(0),
  readCount: integer("readCount").default(0),
  totalCount: integer("totalCount").default(0),
  retargetFromId: integer("retargetFromId"), // ID of the campaign this was retargeted from
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;
export type InsertBroadcastCampaign = typeof broadcastCampaigns.$inferInsert;

/**
 * Broadcast Recipients
 */
export const broadcastRecipients = pgTable("broadcast_recipients", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull().references(() => broadcastCampaigns.id, { onDelete: "cascade" }),
  contactId: integer("contactId").notNull().references(() => whatsappContacts.id, { onDelete: "cascade" }),
  whatsappMessageId: varchar("whatsappMessageId", { length: 255 }),
  status: text("status").$type<"pending" | "sent" | "delivered" | "read" | "failed">().default("pending").notNull(),
  error: text("error"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
});

export type BroadcastRecipient = typeof broadcastRecipients.$inferSelect;
export type InsertBroadcastRecipient = typeof broadcastRecipients.$inferInsert;

/**
 * Scheduled Messages for Follow-ups
 */
export const scheduledMessages = pgTable("scheduled_messages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactId: integer("contactId").notNull().references(() => whatsappContacts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: text("messageType").$type<"text" | "interactive">().default("text").notNull(),
  interactiveData: jsonb("interactiveData").$type<any>(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: text("status").$type<"pending" | "sent" | "failed" | "cancelled">().default("pending").notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = typeof scheduledMessages.$inferInsert;

/**
 * Zoho CRM Configuration and Tokens
 */
export const zohoConfig = pgTable("zoho_config", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("clientId", { length: 255 }).notNull(),
  clientSecret: varchar("clientSecret", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  apiDomain: varchar("apiDomain", { length: 255 }), // e.g., https://www.zohoapis.com
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ZohoConfig = typeof zohoConfig.$inferSelect;
export type InsertZohoConfig = typeof zohoConfig.$inferInsert;
