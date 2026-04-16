import axios from "axios";
import { getZohoConfig, updateZohoTokens } from "./zoho.db";

const ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/auth";
const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";

export function getZohoAuthUrl(clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    scope: "ZohoCRM.modules.ALL,ZohoCRM.users.READ,ZohoCRM.settings.ALL",
    prompt: "consent",
  });

  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

export async function exchangeZohoCode(
  userId: number,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const response = await axios.post(ZOHO_TOKEN_URL, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response.data;

    if (data.error) {
      throw new Error(`Zoho Token Error: ${data.error}`);
    }

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + data.expires_in);

    await updateZohoTokens(userId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      apiDomain: data.api_domain,
      tokenExpiresAt,
    });

    return data;
  } catch (error) {
    console.error("[Zoho Service] Error exchanging code:", error);
    throw error;
  }
}

export async function refreshZohoToken(userId: number) {
  const config = await getZohoConfig(userId);
  if (!config || !config.refreshToken) {
    throw new Error("Zoho configuration or refresh token missing");
  }

  try {
    const params = new URLSearchParams({
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    });

    const response = await axios.post(ZOHO_TOKEN_URL, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response.data;

    if (data.error) {
      throw new Error(`Zoho Refresh Error: ${data.error}`);
    }

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + data.expires_in);

    await updateZohoTokens(userId, {
      accessToken: data.access_token,
      apiDomain: config.apiDomain || "https://www.zohoapis.com",
      tokenExpiresAt,
    });

    return data.access_token;
  } catch (error) {
    console.error("[Zoho Service] Error refreshing token:", error);
    throw error;
  }
}

export async function getValidZohoToken(userId: number) {
  const config = await getZohoConfig(userId);
  if (!config) return null;

  if (config.tokenExpiresAt && config.tokenExpiresAt > new Date()) {
    return config.accessToken;
  }

  return await refreshZohoToken(userId);
}

export async function syncContactToZoho(userId: number, contact: any) {
  const token = await getValidZohoToken(userId);
  if (!token) return null;

  const config = await getZohoConfig(userId);
  const apiDomain = config?.apiDomain || "https://www.zohoapis.com";

  try {
    const response = await axios.post(
      `${apiDomain}/crm/v2/Contacts`,
      {
        data: [
          {
            Last_Name: contact.lastName || contact.displayName || "Unknown",
            First_Name: contact.firstName || "",
            Email: contact.email || "",
            Phone: contact.phoneNumber || "",
            Description: contact.notes || "",
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Zoho Service] Error syncing contact:", error.response?.data || error.message);
    throw error;
  }
}
