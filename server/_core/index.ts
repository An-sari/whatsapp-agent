import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import whatsappEndpoint from "../whatsapp.endpoint";
import zohoEndpoint from "../zoho.endpoint";
import authRouter from "../auth";
import { runNurtureEngine } from "../nurture.service";
import { runScheduledMessageWorker } from "../scheduled.service";

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Start Nurture Engine (every 15 minutes)
  setInterval(runNurtureEngine, 15 * 60 * 1000);
  // Run once on start after a short delay
  setTimeout(runNurtureEngine, 10000);

  // Start Scheduled Message Worker (every 1 minute)
  setInterval(runScheduledMessageWorker, 60 * 1000);
  // Run once on start after a short delay
  setTimeout(runScheduledMessageWorker, 5000);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // WhatsApp webhook endpoint
  app.use("/api/whatsapp", whatsappEndpoint);
  // Zoho OAuth endpoint
  app.use("/api/zoho", zohoEndpoint);
  // Auth routes
  app.use(authRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
