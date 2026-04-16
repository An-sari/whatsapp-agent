# Vercel Deployment Guide - WhatsApp AI Sales Agent

This guide will help you deploy your WhatsApp AI Sales Agent application to Vercel with Supabase database integration.

## Prerequisites

Before you begin, make sure you have:

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your project pushed to GitHub (Vercel integrates with GitHub)
3. **Supabase Project** - Already configured with your database
4. **Supabase Credentials** - Service role key and anon key
5. **Meta WhatsApp Credentials** - Business Phone Number ID, Account ID, Access Token, Webhook Verify Token

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

### 1.2 Verify Project Structure

Ensure your project has:
- `package.json` - Dependencies and scripts
- `vercel.json` - Vercel configuration (already created)
- `server/` - Backend code
- `client/` - Frontend code
- `drizzle/` - Database schema

## Step 2: Create Vercel Project

### 2.1 Connect GitHub to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Search for your repository and click **"Import"**

### 2.2 Configure Project Settings

1. **Project Name**: `whatsapp-ai-sales-agent` (or your preferred name)
2. **Framework Preset**: Select **"Other"** (since we're using custom Vite setup)
3. **Root Directory**: Leave as default (`.`)
4. **Build Command**: `pnpm build`
5. **Output Directory**: `dist`
6. **Install Command**: `pnpm install`

## Step 3: Add Environment Variables

In the Vercel project settings, go to **Settings** → **Environment Variables** and add all the following:

### Supabase Configuration

```
SUPABASE_URL=https://qxllnxbbytqxbgqolrey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGxueGJieXRxeGJncW9scmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM4MzEzNSwiZXhwIjoyMDkwOTU5MTM1fQ.jjCPZsBROucTXzYree4_qndq5wNo2CRxhr-d_wV8yMU
VITE_SUPABASE_URL=https://qxllnxbbytqxbgqolrey.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bGxueGJieXRxeGJncW9scmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODMxMzUsImV4cCI6MjA5MDk1OTEzNX0.8P7d7i06SiY6zJTG6V0EDp3THz7jOXWq9STF31uPLcg
```

### JWT & Session

```
JWT_SECRET=your-secure-random-string-here-min-32-chars
```

Generate a secure JWT secret:
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### OAuth Configuration (from Manus)

```
VITE_APP_ID=your-app-id
VITE_APP_TITLE=WhatsApp AI Sales Agent
VITE_APP_LOGO=https://your-domain.com/logo.png
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
OAUTH_SERVER_URL=https://your-oauth-server.com
```

### Built-in Forge API

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

### Owner Information

```
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id
```

### Analytics (Optional)

```
VITE_ANALYTICS_ENDPOINT=https://your-analytics.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## Step 4: Configure Webhook URL

After your Vercel deployment is live, you'll have a URL like:
```
https://whatsapp-ai-sales-agent.vercel.app
```

### 4.1 Update WhatsApp Webhook Settings

1. Go to your **Meta Business Manager**
2. Navigate to **WhatsApp** → **Configuration**
3. Set your **Webhook URL** to:
   ```
   https://your-vercel-domain.vercel.app/api/whatsapp/webhook
   ```
4. Set your **Webhook Verify Token** (same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)

### 4.2 Store WhatsApp Credentials

You can store WhatsApp credentials in two ways:

**Option A: Environment Variables (Recommended for Production)**
```
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
```

**Option B: Application Settings (Flexible)**
- Use the Settings page in your application to configure credentials
- Credentials are stored in Supabase database

## Step 5: Deploy

### 5.1 Trigger Deployment

Once you've added all environment variables:

1. Click **"Deploy"** button in Vercel
2. Wait for the build to complete (typically 2-5 minutes)
3. Once deployment is successful, you'll see a green checkmark

### 5.2 Monitor Deployment

- Check **Deployments** tab to see build logs
- If build fails, check the logs for errors
- Common issues:
  - Missing environment variables
  - Node version incompatibility
  - Dependency installation failures

## Step 6: Verify Deployment

### 6.1 Test Your Application

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Log in with your credentials
3. Go to **Settings** page
4. Enter your WhatsApp credentials
5. Check the **Webhook Status** indicator - should show "Connected"

### 6.2 Test WhatsApp Integration

1. Send a test message to your WhatsApp Business number
2. Check if the message appears in your Conversations page
3. Verify the AI agent responds automatically

## Step 7: Set Up Custom Domain (Optional)

### 7.1 Add Custom Domain

1. In Vercel project settings, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `whatsapp-agent.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update your WhatsApp webhook URL with the custom domain

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Solution: Check that all dependencies are in `package.json`
- Run `pnpm install` locally and commit `pnpm-lock.yaml`

**Error: "ENOSPC: no space left on device"**
- Solution: This is a Vercel build limitation. Try:
  - Removing unnecessary dependencies
  - Clearing build cache in Vercel settings

### Application Crashes After Deploy

**Error: "Cannot connect to database"**
- Solution: Verify Supabase environment variables are correct
- Check Supabase project is running
- Verify IP whitelist in Supabase settings (should allow all IPs for Vercel)

**Error: "Webhook not receiving messages"**
- Solution: Verify webhook URL is correct in Meta settings
- Check webhook logs in Vercel
- Ensure webhook verify token matches

### Performance Issues

**Slow response times**
- Solution: Check Vercel function duration in logs
- Optimize database queries
- Consider upgrading Vercel plan for more compute power

## Monitoring & Maintenance

### 1. Enable Vercel Analytics

1. Go to Vercel project settings
2. Enable **Web Analytics** (free tier available)
3. Monitor performance metrics

### 2. Set Up Error Tracking

1. Install Sentry or similar error tracking
2. Add error tracking to your application
3. Get alerts for production errors

### 3. Database Backups

1. In Supabase dashboard, go to **Backups**
2. Enable automatic daily backups
3. Test restore procedures regularly

### 4. Monitor Logs

```bash
# View Vercel logs (requires Vercel CLI)
vercel logs

# Or use Vercel dashboard:
# Project → Deployments → Select deployment → Logs
```

## Scaling & Optimization

### For High Traffic

1. **Upgrade Vercel Plan** - Pro or Enterprise for higher limits
2. **Optimize Database** - Add indexes to frequently queried columns
3. **Enable Caching** - Use Vercel's edge caching for static assets
4. **Use CDN** - Serve media through CDN (already configured for S3)

### Cost Optimization

1. **Monitor Usage** - Check Vercel dashboard for usage metrics
2. **Optimize Builds** - Reduce build time with caching
3. **Database Optimization** - Efficient queries reduce Supabase costs
4. **Cleanup Old Data** - Archive old conversations to reduce storage

## Security Checklist

- [ ] All secrets are in Vercel environment variables (not in code)
- [ ] Supabase service role key is marked as "sensitive"
- [ ] JWT secret is cryptographically secure (32+ characters)
- [ ] WhatsApp webhook URL is HTTPS only
- [ ] Database backups are enabled
- [ ] Access logs are monitored
- [ ] Rate limiting is configured for API endpoints
- [ ] CORS is properly configured

## Next Steps

1. **Set up monitoring** - Add error tracking and performance monitoring
2. **Configure backups** - Enable automatic database backups
3. **Add custom domain** - Set up your branded domain
4. **Optimize performance** - Monitor and optimize based on usage
5. **Plan scaling** - Prepare for growth with caching and CDN

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Meta WhatsApp API**: https://developers.facebook.com/docs/whatsapp
- **tRPC Documentation**: https://trpc.io/docs

## Rollback Procedure

If you need to rollback to a previous deployment:

1. Go to Vercel project → **Deployments**
2. Find the previous working deployment
3. Click the three dots menu
4. Select **"Promote to Production"**

Your application will immediately switch to the previous version.
