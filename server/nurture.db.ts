import { eq, and, asc, sql, lt } from "drizzle-orm";
import {
  nurtureSequences,
  nurtureSteps,
  contactNurtureState,
  type InsertNurtureSequence,
  type InsertNurtureStep,
  type InsertContactNurtureState,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Nurture Sequences
 */
export async function createNurtureSequence(data: InsertNurtureSequence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nurtureSequences).values(data).returning();
  return result[0];
}

export async function getNurtureSequencesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(nurtureSequences).where(eq(nurtureSequences.userId, userId));
}

export async function deleteNurtureSequence(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(nurtureSequences).where(and(eq(nurtureSequences.userId, userId), eq(nurtureSequences.id, id)));
}

/**
 * Nurture Steps
 */
export async function createNurtureStep(data: InsertNurtureStep) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nurtureSteps).values(data).returning();
  return result[0];
}

export async function getStepsBySequenceId(sequenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(nurtureSteps).where(eq(nurtureSteps.sequenceId, sequenceId)).orderBy(asc(nurtureSteps.stepNumber));
}

/**
 * Contact Nurture State
 */
export async function enrollContactInSequence(data: InsertContactNurtureState) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First, find the first step of the sequence
  const steps = await getStepsBySequenceId(data.sequenceId);
  const firstStep = steps[0];
  
  const nextRunAt = new Date();
  if (firstStep) {
    nextRunAt.setHours(nextRunAt.getHours() + firstStep.delayHours);
  }

  const result = await db.insert(contactNurtureState).values({
    ...data,
    currentStepId: null, // Not started yet
    nextRunAt,
    status: "active",
  }).returning();
  
  return result[0];
}

export async function getActiveNurtureStatesDue() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return await db.select().from(contactNurtureState).where(
    and(
      eq(contactNurtureState.status, "active"),
      lt(contactNurtureState.nextRunAt, now)
    )
  );
}

export async function updateNurtureState(id: number, data: Partial<InsertContactNurtureState>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(contactNurtureState).set({ ...data, updatedAt: new Date() }).where(eq(contactNurtureState.id, id));
}

export async function stopNurtureForContact(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(contactNurtureState).set({ status: "stopped", updatedAt: new Date() }).where(eq(contactNurtureState.contactId, contactId));
}

export async function getContactNurtureState(contactId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contactNurtureState).where(eq(contactNurtureState.contactId, contactId)).limit(1);
  return result[0] || null;
}
