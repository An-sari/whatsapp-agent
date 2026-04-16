import { eq, and } from "drizzle-orm";
import { zohoConfig, type InsertZohoConfig } from "../drizzle/schema";
import { getDb } from "./db";

export async function getZohoConfig(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(zohoConfig)
      .where(eq(zohoConfig.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Zoho DB] Error in getZohoConfig:", error);
    return null;
  }
}

export async function upsertZohoConfig(config: InsertZohoConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(zohoConfig)
    .where(eq(zohoConfig.userId, config.userId))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(zohoConfig)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(zohoConfig.userId, config.userId));
  }

  return await db.insert(zohoConfig).values(config);
}

export async function updateZohoTokens(
  userId: number,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    apiDomain: string;
    tokenExpiresAt: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(zohoConfig)
    .set({
      ...tokens,
      updatedAt: new Date(),
    })
    .where(eq(zohoConfig.userId, userId));
}

export async function deleteZohoConfig(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(zohoConfig)
    .where(eq(zohoConfig.userId, userId));
}
