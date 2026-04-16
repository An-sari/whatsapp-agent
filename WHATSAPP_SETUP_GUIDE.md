# WhatsApp AI Sales Agent - Setup Guide

This guide will walk you through setting up your WhatsApp AI Sales Agent with Meta's WhatsApp Business API.

## Prerequisites

- A Meta Business Account
- A WhatsApp Business Account
- A phone number to use for WhatsApp messaging
- This application deployed and running

## Step 1: Create a Meta App

1. Go to [Meta Developers](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in the app details:
   - **App Name**: e.g., "WhatsApp Sales Agent"
   - **App Contact Email**: Your business email
   - **App Purpose**: Select **Business**
5. Click **Create App**

## Step 2: Add WhatsApp Product

1. In your Meta App dashboard, click **+ Add Product**
2. Search for **WhatsApp** and click **Set Up**
3. Select **WhatsApp Business Platform**
4. Click **Continue**

## Step 3: Get Your Phone Number ID and Access Token

### Option A: Using Meta's Test Phone Number (Development)

1. In the WhatsApp product settings, go to **Getting Started**
2. You'll see a test phone number ID and temporary access token
3. Use these for development and testing

### Option B: Using Your Own Phone Number (Production)

1. Go to **WhatsApp Business Accounts** in your Meta Business Manager
2. Create or select a WhatsApp Business Account
3. Add your phone number to the account
4. Generate an access token:
   - Go to **Settings** → **API Credentials**
   - Click **Generate Token**
   - Copy the token (you'll need this)
5. Get your Phone Number ID:
   - Go to **Phone Numbers**
   - Click your phone number
   - Copy the **Phone Number ID**

## Step 4: Configure Webhook

Your application needs to receive messages from WhatsApp via a webhook.

### Get Your Webhook URL

Your webhook endpoint is available at:
```
https://your-domain.com/api/whatsapp/webhook
```

Replace `your-domain.com` with your actual domain.

### Set Up Webhook in Meta App

1. In your Meta App dashboard, go to **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. Enter your webhook URL in the **Callback URL** field
4. Generate a **Verify Token** (any random string, e.g., `my_secure_token_123`)
5. Enter this verify token in the **Verify Token** field
6. Click **Verify and Save**

Meta will send a GET request to verify your webhook. Your application will automatically respond with the correct challenge.

### Subscribe to Webhook Events

1. In the same **Configuration** page, scroll to **Webhook Fields**
2. Click **Manage** next to **messages**
3. Select the following events:
   - `messages` - to receive incoming messages
   - `message_status` - to receive delivery/read receipts
4. Click **Done**

## Step 5: Configure Your Application

1. Log in to your WhatsApp AI Sales Agent dashboard
2. Go to **Settings** → **WhatsApp Configuration**
3. Enter the following information:
   - **Business Phone Number ID**: From Step 3
   - **Business Account ID**: From your Meta Business Manager
   - **Access Token**: From Step 3
   - **Webhook Verify Token**: The token you created in Step 4
4. Click **Save Configuration**

## Step 6: Configure Your AI Agent

1. Go to **Agent Settings**
2. Configure:
   - **Agent Name**: e.g., "Sarah - Sales Assistant"
   - **Agent Personality**: Describe how your agent should behave
   - **Sales Script**: Define your sales approach and talking points
   - **Response Style**: Choose professional, casual, or friendly
   - **Escalation Keywords**: Words that trigger human escalation (e.g., "help", "urgent", "problem")
3. Click **Save Configuration**

## Step 7: Test Your Setup

### Send a Test Message

1. From your personal WhatsApp, send a message to your business phone number
2. You should receive an automated response from your AI agent
3. Check the **Conversations** dashboard to see the message thread

### Verify Webhook Delivery

1. In your Meta App dashboard, go to **Webhooks** → **Recent Deliveries**
2. You should see successful webhook deliveries for incoming messages

## Step 8: Monitor and Manage

### View Conversations

- Go to **Conversations** to see all customer interactions
- Click on any conversation to view the full message history
- Send manual replies when needed

### Track Performance

- Go to **Analytics** to see:
  - Total conversations and messages
  - AI response performance
  - Lead qualification rates
  - Average response times

### Manage Notifications

- High-priority leads and escalations will trigger notifications
- You'll be alerted when customers need human intervention

## Troubleshooting

### Webhook Not Receiving Messages

1. Verify your webhook URL is publicly accessible
2. Check that the verify token matches in both your app and Meta dashboard
3. Ensure your application is running and listening on the correct port
4. Check application logs for webhook errors

### Messages Not Sending

1. Verify your access token is correct and hasn't expired
2. Check that the phone number ID is correct
3. Ensure the customer has initiated contact first (WhatsApp requires this)
4. Check that your message is under 4,096 characters

### AI Agent Not Responding

1. Verify agent is enabled in **Agent Settings**
2. Check that "Auto-Respond" is toggled on
3. Review agent configuration for any issues
4. Check application logs for LLM errors

## API Reference

### Webhook Endpoint

**POST** `/api/whatsapp/webhook`

Receives incoming messages and status updates from WhatsApp.

### tRPC Endpoints

All endpoints require authentication.

#### Get Configuration
```
trpc.whatsapp.getConfig.query()
```

#### Update Configuration
```
trpc.whatsapp.updateConfig.mutate({
  businessPhoneNumberId: string,
  businessAccountId: string,
  accessToken: string,
  webhookVerifyToken: string
})
```

#### Get Conversations
```
trpc.whatsapp.getConversations.query()
```

#### Get Conversation Detail
```
trpc.whatsapp.getConversationDetail.query({
  conversationId: number
})
```

#### Send Message
```
trpc.whatsapp.sendMessage.mutate({
  conversationId: number,
  phoneNumber: string,
  message: string
})
```

#### Get Agent Config
```
trpc.whatsapp.getAgentConfig.query()
```

#### Update Agent Config
```
trpc.whatsapp.updateAgentConfig.mutate({
  agentName?: string,
  personality?: string,
  salesScript?: string,
  responseStyle?: 'professional' | 'casual' | 'friendly',
  maxResponseLength?: number,
  autoRespond?: boolean,
  escalationKeywords?: string[]
})
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Meta's [WhatsApp Business Platform documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
3. Check application logs for detailed error messages

## Security Best Practices

1. **Keep your access token secure** - Never commit it to version control
2. **Use environment variables** - Store sensitive credentials in `.env` files
3. **Validate webhook signatures** - Always verify webhook authenticity
4. **Rate limiting** - Implement rate limiting to prevent abuse
5. **Data privacy** - Comply with WhatsApp's data privacy requirements
6. **Regular backups** - Backup your conversation data regularly

## Next Steps

1. Customize your agent's personality and sales scripts
2. Set up response templates for common scenarios
3. Configure escalation rules for complex inquiries
4. Monitor analytics and optimize your agent's performance
5. Train your team on using the dashboard
