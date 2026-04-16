import axios from "axios";
import { getWhatsappConfig } from "./whatsapp.db";

export interface WebhookStatus {
  isConnected: boolean;
  status: "connected" | "disconnected" | "checking" | "invalid_credentials";
  message: string;
  lastChecked: Date;
  responseTime?: number;
  webhookUrl?: string;
  phoneNumberId?: string;
}

/**
 * Check if the WhatsApp webhook is properly configured and connected to Meta API
 */
export async function checkWebhookStatus(userId: number): Promise<WebhookStatus> {
  const startTime = Date.now();

  try {
    // Get WhatsApp configuration
    const config = await getWhatsappConfig(userId);

    if (!config) {
      return {
        isConnected: false,
        status: "invalid_credentials",
        message: "WhatsApp configuration not found. Please configure your credentials in Settings.",
        lastChecked: new Date(),
      };
    }

    // Validate required fields
    if (!config.accessToken || !config.businessPhoneNumberId) {
      return {
        isConnected: false,
        status: "invalid_credentials",
        message: "Missing required credentials (Access Token or Phone Number ID).",
        lastChecked: new Date(),
      };
    }

    // Test connection to Meta API by fetching phone number info
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${config.businessPhoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        const host = process.env.APP_URL || "https://ais-dev-lerjqmlk7eoepmfqspjhw3-320016936591.europe-west1.run.app";
        return {
          isConnected: true,
          status: "connected",
          message: "Successfully connected to Meta WhatsApp API. Webhook is ready to receive messages.",
          lastChecked: new Date(),
          responseTime,
          webhookUrl: `${host}/api/whatsapp/webhook`,
          phoneNumberId: config.businessPhoneNumberId,
        };
      }
    } catch (apiError: any) {
      const responseTime = Date.now() - startTime;

      // Handle specific error cases
      if (apiError.response?.status === 401) {
        return {
          isConnected: false,
          status: "invalid_credentials",
          message: "Access Token is invalid or expired. Please regenerate it from Meta Business Manager.",
          lastChecked: new Date(),
          responseTime,
        };
      }

      if (apiError.response?.status === 404) {
        return {
          isConnected: false,
          status: "invalid_credentials",
          message: "Phone Number ID not found. Please verify the ID in Meta Business Manager.",
          lastChecked: new Date(),
          responseTime,
        };
      }

      if (apiError.code === "ECONNABORTED") {
        return {
          isConnected: false,
          status: "disconnected",
          message: "Connection timeout. Meta API is not responding. Please try again later.",
          lastChecked: new Date(),
          responseTime,
        };
      }

      if (apiError.message === "Network Error" || !apiError.response) {
        return {
          isConnected: false,
          status: "disconnected",
          message: "Network error. Unable to reach Meta API. Check your internet connection.",
          lastChecked: new Date(),
          responseTime,
        };
      }

      const errorMessage = apiError.response?.data?.error?.message || apiError.message;
      return {
        isConnected: false,
        status: "disconnected",
        message: `Meta API Error: ${errorMessage}`,
        lastChecked: new Date(),
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error("Webhook status check error:", error);

    return {
      isConnected: false,
      status: "disconnected",
      message: error.message.includes("timeout") || error.message.includes("CONNECT_TIMEOUT") 
        ? "Database connection timeout. If you are using Supabase, please ensure you are using the Connection Pooler URL (port 6543) in your DATABASE_URL."
        : `Error checking webhook status: ${error.message}`,
      lastChecked: new Date(),
      responseTime,
    };
  }

  return {
    isConnected: false,
    status: "disconnected",
    message: "Unknown error occurred while checking webhook status.",
    lastChecked: new Date(),
  };
}

/**
 * Validate webhook configuration without making external API calls
 * Used for quick local validation
 */
export function validateWebhookConfig(
  businessPhoneNumberId?: string,
  accessToken?: string,
  webhookVerifyToken?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!businessPhoneNumberId || businessPhoneNumberId.trim().length === 0) {
    errors.push("Business Phone Number ID is required");
  } else if (!/^\d+$/.test(businessPhoneNumberId)) {
    errors.push("Phone Number ID should contain only numbers");
  }

  if (!accessToken || accessToken.trim().length === 0) {
    errors.push("Access Token is required");
  } else if (accessToken.length < 50) {
    errors.push("Access Token appears to be invalid (too short)");
  }

  if (!webhookVerifyToken || webhookVerifyToken.trim().length === 0) {
    errors.push("Webhook Verify Token is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
