import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function applySchema() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Applying schema updates...");

  try {
    // Update broadcast_campaigns
    await db.execute(sql`ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS "isTemplate" boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS "templateName" varchar(255)`);
    await db.execute(sql`ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS "languageCode" varchar(10) DEFAULT 'en_US'`);
    await db.execute(sql`ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS "deliveredCount" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS "readCount" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS "retargetFromId" integer`);

    // Update broadcast_recipients
    await db.execute(sql`ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS "whatsappMessageId" varchar(255)`);
    await db.execute(sql`ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS "deliveredAt" timestamp`);
    await db.execute(sql`ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS "readAt" timestamp`);
    
    // Update whatsapp_messages
    await db.execute(sql`ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS "whatsapp_messages_messageType_check"`);
    await db.execute(sql`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS "interactiveData" jsonb`);
    await db.execute(sql`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS "mediaUrl" varchar(2048)`);
    await db.execute(sql`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS "sentiment" text DEFAULT 'neutral'`);
    await db.execute(sql`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS "isFromTemplate" boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS "templateName" varchar(255)`);
    await db.execute(sql`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS "responseTime" integer`);

    // Update whatsapp_contacts
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "firstName" varchar(100)`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "lastName" varchar(100)`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "email" varchar(320)`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "segment" varchar(100)`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "leadScore" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "sentiment" text DEFAULT 'neutral'`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "notes" text`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "isOnline" boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "lastSeenAt" timestamp`);
    await db.execute(sql`ALTER TABLE whatsapp_contacts ADD COLUMN IF NOT EXISTS "lastMessageAt" timestamp`);

    // Update whatsapp_conversations
    await db.execute(sql`ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS "aiMessageCount" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS "humanMessageCount" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS "averageResponseTime" integer DEFAULT 0`);
    await db.execute(sql`ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS "leadQualified" boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS "humanAgentActive" boolean DEFAULT false`);
    
    // Update agent_config
    await db.execute(sql`ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS "aiProvider" text DEFAULT 'gemini'`);
    await db.execute(sql`ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS "aiModel" text DEFAULT 'gemini-2.0-flash'`);
    await db.execute(sql`ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS "aiApiKey" text`);

    console.log("Schema updates applied successfully!");
  } catch (error) {
    console.error("Error applying schema updates:", error);
  }
}

applySchema();
