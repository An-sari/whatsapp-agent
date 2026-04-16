import { Router, Request, Response } from "express";
import { exchangeZohoCode } from "./zoho.service";
import { getZohoConfig } from "./zoho.db";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /auth/zoho/callback - OAuth callback from Zoho
 */
router.get("/auth/zoho/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query;
  
  // In a real app, we'd use 'state' to verify the request and get the userId.
  // For this environment, we'll assume the user is logged in and we can get their ID from the session if available,
  // or we might need to pass it in state.
  // Since we are using popups, we can try to get the user from the session.
  
  // However, TRPC context has the user. Express routes might not have it easily unless we use the same middleware.
  // Let's look at how auth is handled.
  
  // For now, let's try to find the user who has this Zoho config (matching clientId).
  // This is a bit of a hack but should work if we assume one user per clientId for now,
  // or we can pass the userId in the state parameter.
  
  if (!code) {
    return res.status(400).send("Missing code");
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // We need the userId. Let's assume it's passed in state or we can find it.
    // Let's try to get it from the session if possible.
    // Actually, the easiest way is to pass it in 'state'.
    
    const userId = state ? parseInt(state as string) : null;
    
    if (!userId) {
      return res.status(400).send("Missing userId in state");
    }

    const config = await getZohoConfig(userId);
    if (!config) {
      return res.status(400).send("Zoho configuration not found for user");
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/zoho/auth/zoho/callback`;

    await exchangeZohoCode(
      userId,
      code as string,
      config.clientId,
      config.clientSecret,
      redirectUri
    );

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'ZOHO_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/settings';
            }
          </script>
          <p>Zoho CRM connected successfully! This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Zoho Callback Error:", error);
    res.status(500).send("Authentication failed");
  }
});

export default router;
