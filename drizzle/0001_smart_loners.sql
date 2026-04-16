ALTER TABLE "broadcast_campaigns" ADD COLUMN "isTemplate" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD COLUMN "templateName" varchar(255);--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD COLUMN "languageCode" varchar(10) DEFAULT 'en_US';--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD COLUMN "deliveredCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD COLUMN "readCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD COLUMN "retargetFromId" integer;--> statement-breakpoint
ALTER TABLE "broadcast_recipients" ADD COLUMN "whatsappMessageId" varchar(255);--> statement-breakpoint
ALTER TABLE "broadcast_recipients" ADD COLUMN "deliveredAt" timestamp;--> statement-breakpoint
ALTER TABLE "broadcast_recipients" ADD COLUMN "readAt" timestamp;