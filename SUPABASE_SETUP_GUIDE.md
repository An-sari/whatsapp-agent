# Supabase Setup Guide - WhatsApp AI Sales Agent

This guide will help you set up your Supabase database for the WhatsApp AI Sales Agent application.

## Prerequisites

- Supabase account at [supabase.com](https://supabase.com)
- Your Supabase project URL and API keys
- Access to your Supabase dashboard

## Step 1: Create Supabase Project

### 1.1 Create New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `whatsapp-ai-sales-agent`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to initialize (2-3 minutes)

### 1.2 Get Your Credentials

Once your project is created:

1. Go to **Project Settings** → **API**
2. Copy and save:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (marked as "secret")
   - **Anon Public Key**

## Step 2: Create Database Tables

### 2.1 Run SQL Migrations

Your database schema is defined in `drizzle/schema.ts`. The migrations are in `drizzle/migrations/`.

You have two options:

**Option A: Using Supabase SQL Editor (Recommended for first-time setup)**

1. Go to Supabase dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy the SQL from `drizzle/migrations/0001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **"Run"**
6. Verify all tables are created

**Option B: Using Drizzle CLI**

```bash
# Install dependencies
pnpm install

# Generate migrations
pnpm drizzle-kit generate

# Push to Supabase
pnpm drizzle-kit push

# Verify migrations
pnpm drizzle-kit check
```

### 2.2 Verify Tables

In Supabase dashboard, go to **Table Editor** and verify these tables exist:

- `users` - User accounts and authentication
- `whatsapp_configs` - WhatsApp Business Account credentials
- `contacts` - Customer contacts
- `conversations` - Chat conversations
- `messages` - Individual messages
- `agent_configs` - AI agent configuration
- `response_templates` - Pre-written message templates
- `notifications` - System notifications
- `analytics_events` - Analytics data

## Step 3: Configure Database Policies

### 3.1 Enable Row Level Security (RLS)

RLS ensures users can only access their own data.

1. Go to **Authentication** → **Policies**
2. For each table, enable RLS:
   - Click table name
   - Toggle **"Enable RLS"**

### 3.2 Create Policies

For each table, create policies to restrict access:

**Example for `conversations` table:**

```sql
-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Users can only insert their own conversations
CREATE POLICY "Users can create own conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only update their own conversations
CREATE POLICY "Users can update own conversations"
ON conversations FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Users can only delete their own conversations
CREATE POLICY "Users can delete own conversations"
ON conversations FOR DELETE
USING (auth.uid()::text = user_id::text);
```

Repeat similar policies for other tables.

## Step 4: Configure Authentication

### 4.1 Enable OAuth Providers

1. Go to **Authentication** → **Providers**
2. Enable desired providers:
   - Google
   - GitHub
   - Microsoft
   - Or use Manus OAuth

### 4.2 Set Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   - Development: `http://localhost:3000/api/oauth/callback`
   - Production: `https://your-vercel-domain.vercel.app/api/oauth/callback`

## Step 5: Configure Database Backups

### 5.1 Enable Automatic Backups

1. Go to **Project Settings** → **Backups**
2. Enable **"Automatic backups"**
3. Set backup frequency (daily recommended)
4. Set retention period (30 days recommended)

### 5.2 Test Backup & Restore

1. Create a test backup manually
2. Verify backup appears in backup list
3. Test restore procedure (don't actually restore unless needed)

## Step 6: Set Up Monitoring

### 6.1 Enable Query Performance Insights

1. Go to **Project Settings** → **Logs**
2. Enable **"Postgres Logs"**
3. Set log level to "Info"

### 6.2 Monitor Database Health

1. Go to **Project Settings** → **Database**
2. Check:
   - Database size
   - Connection count
   - Query performance

## Step 7: Configure Connection Pooling

For production, use connection pooling to handle multiple connections efficiently.

### 7.1 Enable PgBouncer

1. Go to **Project Settings** → **Database**
2. Look for **"Connection Pooling"**
3. Enable PgBouncer
4. Set pool mode to "Transaction"
5. Copy the pooling connection string

### 7.2 Use Pooling Connection in Production

Update your connection string:

```
postgresql://postgres:password@db.supabase.co:6543/postgres
```

Replace with pooling URL:

```
postgresql://postgres:password@db.supabase.co:5432/postgres
```

## Step 8: Configure Storage (Optional)

If you want to store files (images, documents):

### 8.1 Create Storage Bucket

1. Go to **Storage** → **Buckets**
2. Click **"New Bucket"**
3. Name: `whatsapp-files`
4. Set to **"Public"** for customer-facing files
5. Click **"Create Bucket"**

### 8.2 Configure CORS

1. Go to **Storage** → **Bucket Settings**
2. Configure CORS to allow your domain:
   ```json
   {
     "allowedHeaders": ["*"],
     "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
     "allowedOrigins": ["https://your-vercel-domain.vercel.app"],
     "exposedHeaders": [],
     "maxAgeSeconds": 3600
   }
   ```

## Step 9: Environment Variables

### 9.1 Add to Your Application

```bash
# .env.local (development)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 9.2 Add to Vercel

In Vercel project settings → Environment Variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 10: Test Connection

### 10.1 Run Connection Test

```bash
pnpm test -- server/supabase.connection.test.ts
```

Expected output:
```
✓ Supabase environment variables are valid
✓ Service role JWT token is valid
✓ Anon key JWT token is valid
✓ Supabase URL and JWT token project references match
```

### 10.2 Test Application

1. Start development server: `pnpm dev`
2. Open http://localhost:3000
3. Log in to your application
4. Go to Settings page
5. Verify you can save WhatsApp credentials
6. Check that data is saved in Supabase

## Troubleshooting

### Connection Refused

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
- Verify Supabase project is running
- Check connection string is correct
- Verify IP whitelist (should allow all IPs for development)
- Check firewall settings

### Authentication Failed

**Error**: `Error: invalid JWT`

**Solution**:
- Verify JWT tokens are correct
- Check token expiration
- Regenerate tokens if needed

### Slow Queries

**Error**: Queries taking > 1 second

**Solution**:
- Add indexes to frequently queried columns
- Optimize query logic
- Check database size
- Consider upgrading Supabase plan

### Storage Quota Exceeded

**Error**: `Error: Quota exceeded`

**Solution**:
- Delete old files
- Archive old conversations
- Upgrade Supabase plan
- Implement cleanup jobs

## Database Maintenance

### Regular Tasks

1. **Weekly**: Check database size and performance
2. **Monthly**: Review slow queries and optimize
3. **Quarterly**: Test backup and restore procedures
4. **Annually**: Review and update security policies

### Optimization Tips

1. **Add Indexes** - On frequently queried columns
   ```sql
   CREATE INDEX idx_conversations_user_id ON conversations(user_id);
   CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
   ```

2. **Archive Old Data** - Move conversations older than 1 year to archive table

3. **Vacuum Database** - Clean up deleted rows
   ```sql
   VACUUM ANALYZE;
   ```

4. **Monitor Connections** - Limit concurrent connections

## Security Best Practices

1. **Never commit secrets** - Keep API keys in environment variables
2. **Use RLS** - Enable Row Level Security on all tables
3. **Rotate keys** - Regenerate API keys periodically
4. **Monitor access** - Check logs for suspicious activity
5. **Backup regularly** - Test restore procedures
6. **Use strong passwords** - For database access
7. **Enable 2FA** - On Supabase account

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Status**: https://status.supabase.com
- **Supabase Community**: https://discord.supabase.io
- **Drizzle ORM**: https://orm.drizzle.team

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run database migrations
3. ✅ Configure RLS policies
4. ✅ Set up backups
5. ✅ Test connection
6. ✅ Deploy to Vercel
7. Monitor and optimize based on usage
