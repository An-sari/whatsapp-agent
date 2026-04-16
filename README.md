# WhatsApp AI Sales Agent

An intelligent automation platform that deploys an AI-powered sales agent on WhatsApp to engage customers 24/7, qualify leads, and drive sales—while you maintain complete control.

## 🚀 What It Does

- **Automates customer engagement** - AI responds to customer inquiries instantly
- **Qualifies leads** - Identifies and scores potential customers automatically
- **Maintains conversation context** - Remembers conversation history for natural interactions
- **Escalates intelligently** - Routes complex issues to your team when needed
- **Tracks everything** - Detailed analytics on conversations, response times, and conversions
- **Gives you control** - Customize agent personality, sales scripts, and behavior

## 📊 Key Features

| Feature | Benefit |
|---------|---------|
| **AI-Powered Responses** | Instant, contextual replies to customer inquiries |
| **24/7 Availability** | Your agent works around the clock |
| **Lead Qualification** | Automatically identifies sales opportunities |
| **Human Escalation** | Complex issues route to your team |
| **Performance Analytics** | Track response times, conversion rates, sentiment |
| **Customizable Personality** | Define your agent's tone and approach |
| **Manual Override** | Send personal messages when needed |
| **Message Status Tracking** | Know when messages are sent, delivered, read |

## 🎯 Use Cases

- **E-commerce** - Answer product questions, process orders, handle returns
- **SaaS** - Qualify leads, schedule demos, provide support
- **Service Businesses** - Book appointments, answer FAQs, collect inquiries
- **Real Estate** - Show properties, qualify buyers, schedule viewings
- **Education** - Answer questions, schedule consultations, enroll students

## 📖 Documentation

### For Users
- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 15 minutes
- **[User Guide](./USER_GUIDE.md)** - Complete feature documentation and how-to guide
- **[WhatsApp Setup Guide](./WHATSAPP_SETUP_GUIDE.md)** - Step-by-step Meta App configuration

### For Developers
- **[Technical Documentation](./TECHNICAL_DOCUMENTATION.md)** - Architecture, API, database schema
- **[Vercel Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)** - Deploy to Vercel
- **[Cloudflare Deployment Guide](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)** - Deploy to Cloudflare
- **[API Reference](#api-reference)** - tRPC endpoints and webhooks

## 🚀 Quick Start

### 1. Sign In
Visit your dashboard and authenticate with your account.

### 2. Configure WhatsApp (5 minutes)
- Get credentials from Meta Business Manager
- Enter Phone Number ID, Account ID, and Access Token
- Set webhook verify token

### 3. Customize Your Agent (5 minutes)
- Define agent name and personality
- Write your sales script
- Set response style and escalation keywords

### 4. Test
Send a message from WhatsApp and watch AI respond automatically.

### 5. Deploy
Your agent is now live and engaging customers 24/7!

**[See detailed Quick Start Guide →](./QUICK_START.md)**

## 📱 Dashboard Overview

### Conversations
- View all customer interactions in real-time
- Search conversations by phone number
- See full message history with timestamps
- Send manual messages when needed
- Track conversation status (active, closed, escalated)

### Agent Settings
- Configure AI personality and behavior
- Define sales scripts and approach
- Set response style and length limits
- Define escalation keywords
- Enable/disable auto-response

### Analytics
- Total conversations and messages
- AI response metrics
- Lead qualification rates
- Average response times
- Recent conversation activity

## 🔧 How It Works

```
Customer sends message
        ↓
AI reads conversation history
        ↓
Generates contextual response
        ↓
Checks for escalation triggers
        ↓
Sends response via WhatsApp
        ↓
Stores in conversation history
        ↓
Updates analytics
```

## 🎨 Design

Built with **International Typographic Style** principles:
- Clean, minimalist interface
- Bold red accents on white canvas
- Crisp black sans-serif typography
- Mathematical precision in layout
- Generous negative space

## 🛠️ Technology Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS 4
- shadcn/ui components
- tRPC for type-safe API calls

### Backend
- Express.js 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB database

### AI & Integration
- LLM integration for response generation
- WhatsApp Cloud API integration
- Meta Business Platform
- OAuth authentication

## 📊 Architecture

```
Frontend (React)
    ↓ tRPC Calls
Backend (Express + tRPC)
    ├─ WhatsApp API Integration
    ├─ AI Agent Logic (LLM)
    ├─ Conversation Management
    └─ Analytics Engine
    ↓
Database (MySQL/TiDB)
```

## 🔐 Security

- OAuth authentication with secure session tokens
- HTTPS-only communication
- Webhook signature verification
- Rate limiting per user
- Input validation and sanitization
- Encrypted sensitive data

## 📈 Performance

- Handles unlimited conversations
- AI responses in 2-10 seconds
- Real-time message delivery
- Scalable database architecture
- Optimized queries with indexes

## 🎯 Getting Started

### For First-Time Users
1. Read [Quick Start Guide](./QUICK_START.md) (5 minutes)
2. Follow [WhatsApp Setup Guide](./WHATSAPP_SETUP_GUIDE.md) (10 minutes)
3. Configure agent in dashboard (5 minutes)
4. Send test message and verify

### For Developers
1. Review [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
2. Check [API Reference](#api-reference)
3. Review database schema in `drizzle/schema.ts`
4. Explore tRPC procedures in `server/whatsapp.router.ts`

## 📚 API Reference

### tRPC Endpoints

#### WhatsApp Configuration
```typescript
// Get configuration
trpc.whatsapp.getConfig.query()

// Update configuration
trpc.whatsapp.updateConfig.mutate({
  businessPhoneNumberId: string,
  businessAccountId: string,
  accessToken: string,
  webhookVerifyToken: string
})
```

#### Conversations
```typescript
// Get all conversations
trpc.whatsapp.getConversations.query()

// Get conversation with messages
trpc.whatsapp.getConversationDetail.query({
  conversationId: number
})

// Send message
trpc.whatsapp.sendMessage.mutate({
  conversationId: number,
  phoneNumber: string,
  message: string
})
```

#### Agent Configuration
```typescript
// Get agent config
trpc.whatsapp.getAgentConfig.query()

// Update agent config
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

#### Notifications
```typescript
// Get notifications
trpc.whatsapp.getNotifications.query()

// Mark as read
trpc.whatsapp.markNotificationAsRead.mutate({
  notificationId: number
})
```

### Webhook Endpoint

**POST** `/api/whatsapp/webhook`

Receives incoming messages and status updates from WhatsApp Cloud API.

**Payload:** WhatsApp webhook payload with messages and status updates

**Response:** 200 OK

## 🔄 Workflow Example

### Scenario: Customer Inquiry

1. **Customer sends:** "What are your pricing plans?"
2. **System receives:** Webhook with message
3. **AI processes:**
   - Reads conversation history
   - Loads agent personality and sales script
   - Generates response
4. **AI responds:** "Great question! We offer three plans..."
5. **Customer receives:** Message in WhatsApp
6. **You see:** Conversation in dashboard with AI response
7. **Analytics update:** Message count, response time recorded

### Scenario: Complex Issue

1. **Customer sends:** "I need urgent help with my account"
2. **System detects:** "urgent" and "help" keywords
3. **Escalation triggered:** Conversation marked as escalated
4. **You notified:** Alert about escalated conversation
5. **You take over:** Send manual message to customer
6. **Issue resolved:** You handle personally

## 🎓 Best Practices

### Agent Configuration
- ✅ Be specific and detailed in personality
- ✅ Include concrete examples in sales script
- ✅ Test agent with sample questions
- ✅ Update based on real conversation feedback
- ❌ Don't use vague descriptions
- ❌ Don't overload with too many rules

### Conversation Management
- ✅ Review escalations within 1 hour
- ✅ Follow up on high-value leads personally
- ✅ Reference previous conversation points
- ✅ Provide clear next steps
- ❌ Don't ignore escalations
- ❌ Don't send generic responses

### Analytics & Optimization
- ✅ Review analytics daily
- ✅ Identify patterns in customer questions
- ✅ Update sales script based on feedback
- ✅ Measure impact of changes
- ❌ Don't ignore low performance metrics
- ❌ Don't make changes without testing

## 🆘 Troubleshooting

### Agent Not Responding?
1. Check if auto-response is enabled in Agent Settings
2. Verify conversation isn't escalated
3. Confirm WhatsApp configuration is correct

### Messages Not Sending?
1. Verify phone number format includes country code
2. Check customer hasn't blocked you
3. Regenerate access token if expired

### High Response Time?
1. Simplify agent personality
2. Reduce max response length
3. Check system status

**See [User Guide](./USER_GUIDE.md#troubleshooting) for more troubleshooting →**

## 📞 Support

- **Documentation:** See guides above
- **Issues:** Check troubleshooting sections
- **Feature Requests:** Contact support
- **Bug Reports:** Submit through dashboard

## 🚀 Future Enhancements

- [ ] Multi-language support
- [ ] Media message handling
- [ ] CRM integration
- [ ] Advanced sentiment analysis
- [ ] A/B testing for responses
- [ ] Team collaboration features
- [ ] Advanced reporting and export
- [ ] Custom integrations via webhooks
- [ ] Mobile app for management
- [ ] Voice message support

## 📄 License

All rights reserved. © 2026 WhatsApp AI Sales Agent

## 🙏 Acknowledgments

Built with:
- React & TypeScript
- Tailwind CSS
- tRPC
- Express.js
- Drizzle ORM
- Meta WhatsApp Cloud API

---

## 📖 Documentation Index

1. **[Quick Start Guide](./QUICK_START.md)** - 15-minute setup
2. **[User Guide](./USER_GUIDE.md)** - Complete feature documentation
3. **[WhatsApp Setup Guide](./WHATSAPP_SETUP_GUIDE.md)** - Meta App configuration
4. **[Technical Documentation](./TECHNICAL_DOCUMENTATION.md)** - Architecture & API
5. **[README](./README.md)** - This file

---

**Ready to get started? [See Quick Start Guide →](./QUICK_START.md)**

Your WhatsApp AI Sales Agent is ready to transform your customer engagement. Deploy it today and start automating your sales! 🚀
