# Cloudflare Deployment Guide - WhatsApp AI Sales Agent

This guide will help you deploy your WhatsApp AI Sales Agent application to Cloudflare using **Cloudflare Pages** for the frontend and **Cloudflare Workers** (or Pages Functions) for the backend.

## Prerequisites

Before you begin, make sure you have:

1. **Cloudflare Account** - Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **GitHub Repository** - Your project pushed to GitHub
3. **Supabase Project** - Already configured with your database
4. **Meta WhatsApp Credentials** - Business Phone Number ID, Account ID, Access Token, Webhook Verify Token

---

## Step 1: Prepare Your Repository

### 1.1 Push Your Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: WhatsApp AI Sales Agent"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/whatsapp-ai-sales-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Cloudflare Pages

Cloudflare Pages can host the Vite frontend, but the current Express backend is not directly compatible with Cloudflare Workers without refactoring.

### 2.1 Create a New Pages Project

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub repository and click **Begin setup**

### 2.2 Configure Build Settings

1. **Project Name**: `whatsapp-ai-sales-agent`
2. **Production Branch**: `main`
3. **Framework Preset**: **Vite**
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Root Directory**: `/`

> Note: These settings are only for the frontend build. The current backend is an Express app with scheduled background tasks and cannot be deployed directly to Cloudflare Workers without refactoring.

### 2.3 Add Environment Variables

In the **Environment variables (advanced)** section, add the following variables. 

> **Note**: For Cloudflare Pages, you must add these to both **Production** and **Preview** environments.

#### Database & Auth
- `DATABASE_URL`: Your Supabase connection string (use port 6543)
- `JWT_SECRET`: A secure random string (min 32 chars)
- `OWNER_OPEN_ID`: Your Manus OpenID (for admin access)

#### Meta / WhatsApp API
- `META_APP_ID`: Your Meta App ID
- `META_CLIENT_ID`: Your Meta Client ID
- `META_CLIENT_SECRET`: Your Meta Client Secret
- `WHATSAPP_ACCESS_TOKEN`: Your permanent access token
- `WHATSAPP_BUSINESS_PHONE_NUMBER_ID`: Your Phone Number ID
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Your chosen verify token

#### AI Configuration
- `GEMINI_API_KEY`: Your Google Gemini API key
- `BUILT_IN_FORGE_API_URL`: `https://api.manus.im`
- `BUILT_IN_FORGE_API_KEY`: Your Forge API key

#### App Configuration
- `VITE_APP_ID`: Your Manus App ID
- `VITE_APP_TITLE`: `WhatsApp AI Sales Agent`
- `OAUTH_SERVER_URL`: `https://api.manus.im`

---

## Step 3: Backend Compatibility

This project currently includes a full Express backend with long-running background workers (`setInterval`, `runNurtureEngine`, `runScheduledMessageWorker`) and direct PostgreSQL access. That architecture is not directly compatible with Cloudflare Workers or Pages Functions.

### What can deploy to Cloudflare
- The static frontend built by Vite can be deployed to Cloudflare Pages.
- API endpoints and scheduled jobs require a separate Node host or a rewrite for Cloudflare Workers.

### If you want to use Cloudflare for the backend
- You would need to port the backend to a Workers-compatible architecture.
- Remove Express and scheduled background intervals.
- Use Cloudflare Cron Triggers for recurring jobs.
- Use `nodejs_compat` only if you are targeting a custom Node-compatible runtime, but this is experimental.

### Placeholder `wrangler.toml`

A `wrangler.toml` file is included as a starting point for future Cloudflare Worker porting, but the current code will not deploy successfully without refactoring.

---

## Step 4: Configure WhatsApp Webhook & Meta Coexistence

Once your app is deployed, Cloudflare will provide a URL like `https://whatsapp-ai-sales-agent.pages.dev`.

### 4.1 What is Meta Coexistence?
Meta Coexistence allows your AI agent to work alongside human agents. In this app, it means:
- **AI Handling**: AI handles all initial queries and qualifies leads.
- **Human Takeover**: You can manually "Take Over" a chat in the dashboard, which pauses the AI.
- **Auto-Escalation**: AI automatically pauses when "Escalation Keywords" are detected.

### 4.2 Webhook Setup
1. Go to your **Meta Business Suite** → **WhatsApp Manager** → **Configuration**
2. Set the **Callback URL** to:
   ```
   https://your-app.pages.dev/api/whatsapp/webhook
   ```
3. Set the **Verify Token** to the value you set in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Subscribe to **messages** in the Webhook fields.

---

## Step 5: Verify Deployment

1. Visit your Cloudflare URL.
2. Log in and navigate to **Settings**.
3. Ensure the **Webhook Status** shows "Connected".
4. Send a message to your WhatsApp number and verify the AI responds.

---

## Troubleshooting

### Database Connection Issues
Cloudflare Workers/Pages run in a serverless environment. Ensure your Supabase database allows connections from all IPs or use the **Supabase Connection Pooler** (port 6543) which is required for serverless environments.

### "Module not found" Errors
Ensure all dependencies are listed in `package.json`. Cloudflare builds using the same environment as your local machine, so if it works locally with `npm run build`, it should work there.

### Webhook 404 or 500
Check the **Functions** logs in the Cloudflare Pages dashboard to see real-time error logs for your API endpoints.

---

## Support

For more details on the architecture, refer to the [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md).
