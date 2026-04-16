# WhatsApp AI Sales Agent - Technical Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Tailwind)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Conversations│  │ Agent Config │  │  Analytics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ tRPC Calls
┌────────────────────────▼────────────────────────────────────┐
│              Backend (Express + tRPC)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ WhatsApp API │  │ AI Agent     │  │ Auth & Users │      │
│  │ Integration  │  │ (LLM)        │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Webhooks
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────────┐  ┌──────────┐
   │WhatsApp │    │ Database     │  │ LLM API  │
   │Cloud API│    │ (MySQL/TiDB) │  │ (OpenAI) │
   └─────────┘    └──────────────┘  └──────────┘
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### WhatsApp Configuration
```sql
CREATE TABLE whatsappConfig (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  businessPhoneNumberId VARCHAR(255) NOT NULL,
  businessAccountId VARCHAR(255) NOT NULL,
  accessToken TEXT NOT NULL,
  webhookVerifyToken VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  whatsappContactId VARCHAR(255) NOT NULL,
  whatsappConversationId VARCHAR(255),
  status ENUM('active', 'closed', 'escalated') DEFAULT 'active',
  leadQualified BOOLEAN DEFAULT FALSE,
  messageCount INT DEFAULT 0,
  aiMessageCount INT DEFAULT 0,
  averageResponseTime INT DEFAULT 0,
  lastMessageAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  conversationId INT NOT NULL,
  sender ENUM('customer', 'agent', 'human') NOT NULL,
  messageType VARCHAR(50) DEFAULT 'text',
  content LONGTEXT NOT NULL,
  status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  whatsappMessageId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (conversationId) REFERENCES conversations(id)
);
```

### Agent Configuration
```sql
CREATE TABLE agentConfig (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  agentName VARCHAR(255),
  personality LONGTEXT,
  salesScript LONGTEXT,
  responseStyle ENUM('professional', 'casual', 'friendly') DEFAULT 'professional',
  maxResponseLength INT DEFAULT 500,
  isActive BOOLEAN DEFAULT TRUE,
  autoRespond BOOLEAN DEFAULT TRUE,
  escalationKeywords JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Response Templates
```sql
CREATE TABLE responseTemplates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  content LONGTEXT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Notifications
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  type ENUM('escalation', 'lead', 'alert') DEFAULT 'alert',
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  conversationId INT,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (conversationId) REFERENCES conversations(id)
);
```

---

## API Endpoints

### WhatsApp Webhook

**Endpoint:** `POST /api/whatsapp/webhook`

**Purpose:** Receive incoming messages and status updates from WhatsApp Cloud API

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "ENTRY_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "1234567890",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "messages": [
              {
                "from": "1234567890",
                "id": "MESSAGE_ID",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Customer message text"
                }
              }
            ],
            "statuses": [
              {
                "id": "MESSAGE_ID",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "1234567890"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response:** `200 OK`

---

### tRPC Procedures

#### WhatsApp Configuration

**Get Configuration**
```typescript
trpc.whatsapp.getConfig.query()
```

Returns current WhatsApp configuration for authenticated user.

**Update Configuration**
```typescript
trpc.whatsapp.updateConfig.mutate({
  businessPhoneNumberId: string,
  businessAccountId: string,
  accessToken: string,
  webhookVerifyToken: string
})
```

Updates WhatsApp Business Account credentials.

---

#### Conversations

**Get All Conversations**
```typescript
trpc.whatsapp.getConversations.query()
```

Returns array of all conversations for authenticated user.

**Get Conversation Detail**
```typescript
trpc.whatsapp.getConversationDetail.query({
  conversationId: number
})
```

Returns conversation with all messages.

**Send Message**
```typescript
trpc.whatsapp.sendMessage.mutate({
  conversationId: number,
  phoneNumber: string,
  message: string
})
```

Sends message via WhatsApp and stores in database.

---

#### Agent Configuration

**Get Agent Config**
```typescript
trpc.whatsapp.getAgentConfig.query()
```

Returns current agent configuration.

**Update Agent Config**
```typescript
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

Updates agent personality and behavior settings.

---

#### Notifications

**Get Notifications**
```typescript
trpc.whatsapp.getNotifications.query()
```

Returns all notifications for authenticated user.

**Mark as Read**
```typescript
trpc.whatsapp.markNotificationAsRead.mutate({
  notificationId: number
})
```

Marks notification as read.

---

## AI Agent Logic

### Response Generation Flow

```
1. Incoming Message
   ↓
2. Fetch Conversation History
   ↓
3. Fetch Agent Configuration
   ↓
4. Build System Prompt
   ├─ Agent Personality
   ├─ Sales Script
   └─ Conversation Context
   ↓
5. Call LLM API
   ├─ System Prompt
   ├─ Conversation History
   └─ New Customer Message
   ↓
6. Check for Escalation Keywords
   ├─ If found → Mark as Escalated
   └─ If not → Continue
   ↓
7. Generate Response
   ├─ Truncate if too long
   └─ Format for WhatsApp
   ↓
8. Send via WhatsApp API
   ↓
9. Store in Database
   ↓
10. Update Conversation Metadata
```

### System Prompt Construction

```typescript
const systemPrompt = `
You are ${agentConfig.agentName}.

${agentConfig.personality}

Your sales approach:
${agentConfig.salesScript}

Communication style: ${agentConfig.responseStyle}

Guidelines:
- Keep responses under ${agentConfig.maxResponseLength} characters
- Be helpful and professional
- Focus on understanding customer needs
- Provide clear next steps
- If customer seems frustrated or uses keywords like [${escalationKeywords.join(', ')}], 
  suggest speaking with a human agent

Previous conversation:
${conversationHistory}

Customer's new message: ${customerMessage}

Respond naturally and helpfully:
`;
```

### Escalation Detection

```typescript
function shouldEscalate(message: string, keywords: string[]): boolean {
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}
```

---

## File Structure

```
whatsapp-ai-sales-agent/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Landing & dashboard
│   │   │   ├── Conversations.tsx     # Conversation monitoring
│   │   │   ├── AgentConfig.tsx       # Agent settings
│   │   │   └── Analytics.tsx         # Performance metrics
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   └── DashboardLayout.tsx   # Main layout
│   │   ├── lib/
│   │   │   └── trpc.ts               # tRPC client
│   │   ├── App.tsx                   # Router setup
│   │   └── index.css                 # Global styles
│   └── public/
│       └── favicon.ico
├── server/
│   ├── whatsapp.db.ts                # Database helpers
│   ├── whatsapp.webhook.ts           # Webhook & AI logic
│   ├── whatsapp.router.ts            # tRPC procedures
│   ├── whatsapp.endpoint.ts          # Express endpoint
│   ├── routers.ts                    # Main router
│   ├── db.ts                         # Database connection
│   └── _core/
│       ├── index.ts                  # Server entry point
│       ├── context.ts                # tRPC context
│       ├── trpc.ts                   # tRPC setup
│       ├── llm.ts                    # LLM integration
│       └── oauth.ts                  # OAuth setup
├── drizzle/
│   ├── schema.ts                     # Database schema
│   └── migrations/                   # Migration files
├── shared/
│   └── const.ts                      # Shared constants
├── WHATSAPP_SETUP_GUIDE.md           # Setup instructions
├── USER_GUIDE.md                     # User documentation
└── package.json
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/dbname

# Authentication
JWT_SECRET=your_jwt_secret_key
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# LLM Integration
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key

# Application
VITE_APP_TITLE=WhatsApp AI Sales Agent
VITE_APP_LOGO=https://cdn.example.com/logo.png
NODE_ENV=production
PORT=3000
```

---

## Deployment

### Prerequisites
- Node.js 18+
- MySQL/TiDB database
- Meta Business Account with WhatsApp API access

### Build Process

```bash
# Install dependencies
pnpm install

# Generate database migrations
pnpm drizzle-kit generate

# Build application
pnpm build

# Start production server
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Environment Setup

1. Set all environment variables
2. Ensure database is accessible
3. Configure WhatsApp webhook URL
4. Test webhook connectivity
5. Deploy application

---

## Performance Optimization

### Database Indexes

```sql
CREATE INDEX idx_userId ON conversations(userId);
CREATE INDEX idx_conversationId ON messages(conversationId);
CREATE INDEX idx_whatsappContactId ON conversations(whatsappContactId);
CREATE INDEX idx_createdAt ON messages(createdAt);
```

### Caching Strategy

- Cache agent configuration (5 minute TTL)
- Cache user preferences (10 minute TTL)
- Cache conversation summaries (1 hour TTL)

### Rate Limiting

```typescript
// Limit API calls per user
const rateLimit = {
  messages: 100 / 60,        // 100 messages per minute
  webhooks: 1000 / 60,       // 1000 webhooks per minute
  config_updates: 10 / 60    // 10 config updates per minute
};
```

---

## Security Considerations

### Authentication
- All endpoints require OAuth authentication
- Session tokens stored in secure HTTP-only cookies
- Token expiration: 24 hours

### Data Protection
- All sensitive data encrypted at rest
- HTTPS required for all communication
- Webhook signatures verified

### Rate Limiting
- Per-user rate limits on API calls
- Webhook request throttling
- Message sending limits

### Input Validation
- All user inputs sanitized
- Message content validated before sending
- Configuration parameters type-checked

---

## Monitoring & Logging

### Key Metrics

```typescript
interface Metrics {
  messagesPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  webhookDeliveryRate: number;
  aiResponseQuality: number;
}
```

### Log Levels

- **ERROR** - Critical failures, requires immediate action
- **WARN** - Potential issues, should investigate
- **INFO** - Normal operations, informational
- **DEBUG** - Detailed debugging information

### Example Logs

```
[2026-04-05T15:30:00.000Z] INFO: Webhook received for conversation 123
[2026-04-05T15:30:01.250Z] DEBUG: AI generating response for message 456
[2026-04-05T15:30:02.500Z] INFO: Response sent to customer +1234567890
[2026-04-05T15:30:03.000Z] INFO: Message status updated to delivered
```

---

## Testing

### Unit Tests

```typescript
// Example test
describe('whatsapp.webhook', () => {
  it('should process incoming message and generate response', async () => {
    const message = {
      from: '1234567890',
      text: { body: 'What are your prices?' }
    };
    
    const response = await processIncomingMessage(userId, message);
    
    expect(response).toBeDefined();
    expect(response.content).toContain('price');
  });
});
```

### Integration Tests

```typescript
// Test full workflow
describe('conversation flow', () => {
  it('should handle complete conversation', async () => {
    // 1. Send initial message
    // 2. Verify AI response
    // 3. Send follow-up
    // 4. Verify escalation if needed
  });
});
```

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not receiving messages | Incorrect URL or token | Verify webhook URL and token in Meta dashboard |
| Messages not sending | Invalid access token | Regenerate token from Meta Business Manager |
| High response time | Complex agent config | Simplify personality and sales script |
| Database connection errors | Connection string invalid | Verify DATABASE_URL environment variable |
| LLM API errors | Rate limit exceeded | Implement exponential backoff retry |

---

## Future Enhancements

- [ ] Multi-language support
- [ ] Media message handling (images, videos)
- [ ] CRM integration
- [ ] Advanced sentiment analysis
- [ ] A/B testing for agent responses
- [ ] Conversation templates
- [ ] Team collaboration features
- [ ] Advanced analytics and reporting
- [ ] Custom integrations via webhooks
- [ ] Mobile app for on-the-go management

---

## Support & Resources

- **Documentation**: See USER_GUIDE.md and WHATSAPP_SETUP_GUIDE.md
- **API Reference**: Available in application
- **Code Examples**: See server/whatsapp.router.ts
- **Issue Tracking**: Report issues in application dashboard
