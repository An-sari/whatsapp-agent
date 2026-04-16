CREATE TABLE "agent_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"agentName" varchar(255) DEFAULT 'AI Sales Agent',
	"personality" text,
	"salesScript" text,
	"responseStyle" varchar(100) DEFAULT 'professional',
	"maxResponseLength" integer DEFAULT 500,
	"isActive" boolean DEFAULT true,
	"autoRespond" boolean DEFAULT true,
	"escalationKeywords" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_config_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"conversationId" integer,
	"contactId" integer,
	"eventType" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"configId" integer,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduledAt" timestamp,
	"sentCount" integer DEFAULT 0,
	"totalCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaignId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"sentAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "contact_nurture_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"sequenceId" integer NOT NULL,
	"currentStepId" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"nextRunAt" timestamp,
	"lastRunAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"secret" varchar(255),
	"events" jsonb DEFAULT '["message_received","lead_qualified","escalation_triggered"]'::jsonb,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"content" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"documentId" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"conversationId" integer,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nurture_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nurture_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"sequenceId" integer NOT NULL,
	"stepNumber" integer NOT NULL,
	"delayHours" integer NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"isActive" boolean DEFAULT true,
	"usageCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"content" text NOT NULL,
	"messageType" text DEFAULT 'text' NOT NULL,
	"interactiveData" jsonb,
	"scheduledAt" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nickname" varchar(255),
	"phoneNumber" varchar(20),
	"connectionMethod" text DEFAULT 'cloud_api' NOT NULL,
	"businessPhoneNumberId" varchar(255) NOT NULL,
	"businessAccountId" varchar(255) NOT NULL,
	"accessToken" text NOT NULL,
	"webhookVerifyToken" varchar(255) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_config_businessPhoneNumberId_unique" UNIQUE("businessPhoneNumberId")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"configId" integer,
	"phoneNumber" varchar(20) NOT NULL,
	"displayName" varchar(255),
	"firstName" varchar(100),
	"lastName" varchar(100),
	"email" varchar(320),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"segment" varchar(100),
	"leadScore" integer DEFAULT 0,
	"sentiment" text DEFAULT 'neutral',
	"notes" text,
	"lastMessageAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"configId" integer,
	"contactId" integer NOT NULL,
	"whatsappContactId" varchar(255) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"lastMessageAt" timestamp,
	"messageCount" integer DEFAULT 0,
	"aiMessageCount" integer DEFAULT 0,
	"humanMessageCount" integer DEFAULT 0,
	"averageResponseTime" integer DEFAULT 0,
	"leadQualified" boolean DEFAULT false,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"configId" integer,
	"conversationId" integer NOT NULL,
	"whatsappMessageId" varchar(255),
	"sender" text NOT NULL,
	"messageType" text DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"interactiveData" jsonb,
	"mediaUrl" varchar(2048),
	"status" text DEFAULT 'sent' NOT NULL,
	"sentiment" text DEFAULT 'neutral',
	"isFromTemplate" boolean DEFAULT false,
	"templateName" varchar(255),
	"responseTime" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_whatsappMessageId_unique" UNIQUE("whatsappMessageId")
);
--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_configId_whatsapp_config_id_fk" FOREIGN KEY ("configId") REFERENCES "public"."whatsapp_config"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_campaignId_broadcast_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."broadcast_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_contactId_whatsapp_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."whatsapp_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_nurture_state" ADD CONSTRAINT "contact_nurture_state_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_nurture_state" ADD CONSTRAINT "contact_nurture_state_contactId_whatsapp_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."whatsapp_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_nurture_state" ADD CONSTRAINT "contact_nurture_state_sequenceId_nurture_sequences_id_fk" FOREIGN KEY ("sequenceId") REFERENCES "public"."nurture_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_nurture_state" ADD CONSTRAINT "contact_nurture_state_currentStepId_nurture_steps_id_fk" FOREIGN KEY ("currentStepId") REFERENCES "public"."nurture_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_documentId_knowledge_base_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurture_sequences" ADD CONSTRAINT "nurture_sequences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurture_steps" ADD CONSTRAINT "nurture_steps_sequenceId_nurture_sequences_id_fk" FOREIGN KEY ("sequenceId") REFERENCES "public"."nurture_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_contactId_whatsapp_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."whatsapp_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_configId_whatsapp_config_id_fk" FOREIGN KEY ("configId") REFERENCES "public"."whatsapp_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_configId_whatsapp_config_id_fk" FOREIGN KEY ("configId") REFERENCES "public"."whatsapp_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_configId_whatsapp_config_id_fk" FOREIGN KEY ("configId") REFERENCES "public"."whatsapp_config"("id") ON DELETE no action ON UPDATE no action;