import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function applyZohoSchema() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Creating zoho_config table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "zoho_config" (
        "id" serial PRIMARY KEY,
        "userId" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "clientId" varchar(255) NOT NULL,
        "clientSecret" varchar(255) NOT NULL,
        "accessToken" text,
        "refreshToken" text,
        "apiDomain" varchar(255),
        "tokenExpiresAt" timestamp,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    console.log("zoho_config table created successfully!");
  } catch (error) {
    console.error("Error creating zoho_config table:", error);
  }
}

applyZohoSchema();
