import express from "express";
import axios from "axios";
import { upsertWhatsappConfig } from "./whatsapp.db";
import { sdk } from "./_core/sdk";

const router = express.Router();

// Meta OAuth / Embedded Signup URL
router.get("/api/auth/meta/url", async (req, res) => {
  const user = await sdk.authenticateRequest(req);
  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/meta/callback`;

  if (!appId) {
    return res.status(500).json({ error: "Meta App ID not configured" });
  }

  // Meta Embedded Signup scopes
  const scopes = [
    "whatsapp_business_management",
    "whatsapp_business_messaging",
    "business_management"
  ].join(",");

  // Use state to pass userId securely
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}`;

  res.json({ url: authUrl });
});

// Meta OAuth Callback
router.get("/auth/meta/callback", async (req, res) => {
  const { code, state } = req.query;
  
  let userId: number | undefined;
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
      userId = decodedState.userId;
    } catch (e) {
      console.error("Failed to decode state:", e);
    }
  }

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/meta/callback`;

    // 1. Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Get WhatsApp Business Accounts
    const accountsResponse = await axios.get(`https://graph.facebook.com/v18.0/me/whatsapp_business_accounts`, {
      params: { access_token: accessToken },
    });

    const accounts = accountsResponse.data.data;
    if (!accounts || accounts.length === 0) {
      throw new Error("No WhatsApp Business Accounts found");
    }

    const businessAccountId = accounts[0].id;

    // 3. Get Phone Numbers for the account
    const phoneNumbersResponse = await axios.get(`https://graph.facebook.com/v18.0/${businessAccountId}/phone_numbers`, {
      params: { access_token: accessToken },
    });

    const phoneNumbers = phoneNumbersResponse.data.data;
    if (!phoneNumbers || phoneNumbers.length === 0) {
      throw new Error("No Phone Numbers found in the WhatsApp Business Account");
    }

    const phoneNumberId = phoneNumbers[0].id;
    const phoneNumber = phoneNumbers[0].display_phone_number;

    // 4. Upsert config
    if (userId) {
      await upsertWhatsappConfig({
        userId: userId,
        nickname: `Meta: ${phoneNumber}`,
        phoneNumber: phoneNumber,
        businessPhoneNumberId: phoneNumberId,
        businessAccountId: businessAccountId,
        accessToken: accessToken,
        webhookVerifyToken: "meta_connected_" + Math.random().toString(36).substring(7),
        connectionMethod: "cloud_api",
      });
    }

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'META_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/settings';
            }
          </script>
          <p>Meta connection successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Meta OAuth Error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed: " + (error.response?.data?.error?.message || error.message));
  }
});

export default router;
