import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { parse as parseCsv } from "csv-parse/sync";
import * as cheerio from "cheerio";
import axios from "axios";
import {
  createKnowledgeBase,
  updateKnowledgeBaseStatus,
  createKnowledgeChunks,
  deleteChunksByDocumentId,
} from "./knowledge.db";
import { type InsertKnowledgeChunk } from "../drizzle/schema";

/**
 * Text Extraction from PDF
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Text Extraction from CSV
 */
async function extractTextFromCsv(buffer: Buffer): Promise<string> {
  const records = parseCsv(buffer, {
    columns: true,
    skip_empty_lines: true,
  });
  return records.map((r: any) => Object.values(r).join(" ")).join("\n");
}

/**
 * Text Extraction from Website
 */
async function extractTextFromUrl(url: string): Promise<string> {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  // Remove scripts, styles, and other non-content elements
  $("script, style, nav, footer, header, noscript").remove();
  
  // Extract text from body
  return $("body").text().replace(/\s+/g, " ").trim();
}

/**
 * Chunking Strategy
 */
function chunkText(text: string, chunkSize = 1000, chunkOverlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += chunkSize - chunkOverlap;
  }
  
  return chunks;
}

/**
 * Generate Embeddings using Gemini
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  // Gemini embedding-2-preview can handle multiple texts
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: texts,
  });
  
  if (!result.embeddings) return [];
  
  return result.embeddings.map((e) => e.values || []);
}

/**
 * Process Knowledge Base Document
 */
export async function processKnowledgeBaseDocument(userId: number, docId: number) {
  try {
    const db = await import("./knowledge.db");
    const doc = await db.getKnowledgeBaseById(userId, docId);
    if (!doc) throw new Error("Document not found");

    let text = "";
    if (doc.type === "url") {
      text = await extractTextFromUrl(doc.source);
    } else {
      // For files, we'll assume the source is a URL or we'll fetch it if we have it stored.
      // Since we don't have a file storage system yet, we'll assume the user provides a URL for now.
      // Or we can handle base64 if we pass it.
      // Let's assume for now we have the content if it was passed during creation.
      text = doc.content || "";
    }

    if (!text) {
      await updateKnowledgeBaseStatus(docId, "failed");
      return;
    }

    // Update doc with extracted text
    await updateKnowledgeBaseStatus(docId, "processing", text);

    // Chunk text
    const chunks = chunkText(text);
    
    // Generate embeddings for chunks
    // To avoid hitting rate limits, we'll process in batches if needed.
    const embeddings = await generateEmbeddings(chunks);

    // Store chunks
    const insertChunks: InsertKnowledgeChunk[] = chunks.map((content, i) => ({
      userId,
      documentId: docId,
      content,
      embedding: JSON.stringify(embeddings[i]),
      metadata: { index: i, source: doc.name },
    }));

    await createKnowledgeChunks(insertChunks);
    await updateKnowledgeBaseStatus(docId, "completed", text);

  } catch (error) {
    console.error("Error processing knowledge base document:", error);
    await updateKnowledgeBaseStatus(docId, "failed");
  }
}

/**
 * Search Knowledge Base for Context
 */
export async function getRelevantContext(userId: number, query: string, limit_count = 3): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    // Generate embedding for query
    const queryEmbeddingResult = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [query],
    });
    const queryEmbedding = queryEmbeddingResult.embeddings?.[0]?.values;

    if (!queryEmbedding) return "";

    // Search in DB
    const db = await import("./knowledge.db");
    // For now, we'll use a simple approach: fetch all chunks and calculate similarity in memory
    // In a real app, you'd use pgvector or a vector DB.
    // Since we are in a preview, we'll fetch chunks and do a simple search.
    // We'll limit the number of chunks to avoid memory issues.
    const chunks = await db.searchKnowledgeBase(userId, queryEmbedding, 100);
    
    if (chunks.length === 0) return "";

    // Calculate cosine similarity in memory
    const scoredChunks = chunks.map((chunk) => {
      const chunkEmbedding = JSON.parse(chunk.embedding || "[]") as number[];
      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { ...chunk, score };
    });

    // Sort by score and take top N
    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit_count);

    return topChunks.map((c) => c.content).join("\n\n---\n\n");
  } catch (error) {
    console.error("Error getting relevant context:", error);
    return "";
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
