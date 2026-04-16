import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getZohoConfig, upsertZohoConfig, deleteZohoConfig } from "./zoho.db";
import { getZohoAuthUrl, syncContactToZoho } from "./zoho.service";

export const zohoRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    return await getZohoConfig(ctx.user.id);
  }),

  updateConfig: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        clientSecret: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertZohoConfig({
        userId: ctx.user.id,
        ...input,
        isActive: true,
      });
      return { success: true };
    }),

  deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteZohoConfig(ctx.user.id);
    return { success: true };
  }),

  getAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await getZohoConfig(ctx.user.id);
      if (!config) throw new Error("Zoho configuration missing");
      
      return { url: getZohoAuthUrl(config.clientId, input.redirectUri) };
    }),

  syncContact: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getContactById } = await import("./whatsapp.db");
      const contact = await getContactById(ctx.user.id, input.contactId);
      if (!contact) throw new Error("Contact not found");

      return await syncContactToZoho(ctx.user.id, contact);
    }),
});
