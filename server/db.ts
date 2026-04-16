import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _dbPromise: Promise<ReturnType<typeof drizzle> | null> | null = null;

// Lazily create the drizzle instance
export async function getDb() {
  if (_db) return _db;
  
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        console.warn("[Database] DATABASE_URL not found, database operations will fail");
        return null;
      }

      try {
        let finalConnectionString = connectionString;
        
        // Auto-fix for Supabase direct connection (port 5432) which is often blocked
        if (finalConnectionString.includes("supabase.co:5432")) {
          console.log("[Database] Detected Supabase direct connection (port 5432). Attempting to use connection pooler (port 6543) for better reliability...");
          finalConnectionString = finalConnectionString.replace(":5432", ":6543");
        }

        console.log("[Database] Initializing PostgreSQL client...");
        const client = postgres(finalConnectionString, { 
          prepare: false,
          connect_timeout: 10,
          idle_timeout: 20,
          max: 10,
          keep_alive: 60,
          ssl: 'require',
        });
        
        console.log("[Database] Running connection test (SELECT 1)...");
        // Test connection with a timeout
        const connectionTest = Promise.race([
          client`SELECT 1`.then(() => "success"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Connection test timed out after 5s")), 5000))
        ]);

        const testResult = await connectionTest;
        console.log("[Database] Connection test result:", testResult);
        _db = drizzle(client);
        return _db;
      } catch (error: any) {
        console.error("[Database] CRITICAL: Failed to connect to PostgreSQL:", error.message);
        
        if (error.message.includes("timeout") || error.message.includes("CONNECT_TIMEOUT")) {
          console.error("[Database] TIP: If you are using Supabase, ensure you are using the Connection Pooler URL (port 6543) instead of the direct connection (port 5432).");
        }
        
        _dbPromise = null; // Allow retry on next call
        return null;
      }
    })();
  }
  
  return _dbPromise;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, any> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
