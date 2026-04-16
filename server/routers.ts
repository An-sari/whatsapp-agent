import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { whatsappRouter } from "./whatsapp.router";
import { zohoRouter } from "./zoho.router";
import { systemRouter } from "./_core/systemRouter";
import * as knowledgeDb from "./knowledge.db";
import * as nurtureDb from "./nurture.db";
import { processKnowledgeBaseDocument } from "./knowledge.service";

export const appRouter = router({
  // ... existing routes ...
  system: systemRouter,
  whatsapp: whatsappRouter,
  zoho: zohoRouter,
  
  nurture: router({
    getSequences: protectedProcedure.query(async ({ ctx }) => {
      return await nurtureDb.getNurtureSequencesByUserId(ctx.user.id);
    }),
    
    getSteps: protectedProcedure
      .input(z.object({ sequenceId: z.number() }))
      .query(async ({ input }) => {
        return await nurtureDb.getStepsBySequenceId(input.sequenceId);
      }),
    
    createSequence: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await nurtureDb.createNurtureSequence({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          isActive: true,
        });
      }),
    
    addStep: protectedProcedure
      .input(z.object({
        sequenceId: z.number(),
        stepNumber: z.number(),
        delayHours: z.number(),
        content: z.string(),
        type: z.enum(["text", "ai_prompt"]),
      }))
      .mutation(async ({ input }) => {
        return await nurtureDb.createNurtureStep(input);
      }),
    
    enrollContact: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        sequenceId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await nurtureDb.enrollContactInSequence({
          userId: ctx.user.id,
          contactId: input.contactId,
          sequenceId: input.sequenceId,
        });
      }),
    
    getContactState: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        return await nurtureDb.getContactNurtureState(input.contactId);
      }),
    
    stopNurture: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .mutation(async ({ input }) => {
        return await nurtureDb.stopNurtureForContact(input.contactId);
      }),
  }),
  
  knowledge: router({
    getDocuments: protectedProcedure.query(async ({ ctx }) => {
      return await knowledgeDb.getKnowledgeBaseByUserId(ctx.user.id);
    }),
    
    addDocument: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["file", "url"]),
        source: z.string(),
        content: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const doc = await knowledgeDb.createKnowledgeBase({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          source: input.source,
          content: input.content,
          status: "processing",
        });
        
        // Start processing in background
        processKnowledgeBaseDocument(ctx.user.id, doc.id).catch(console.error);
        
        return doc;
      }),
      
    deleteDocument: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await knowledgeDb.deleteKnowledgeBase(ctx.user.id, input.id);
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
