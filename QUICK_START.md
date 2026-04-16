# WhatsApp AI Sales Agent - Quick Start Guide

Get your AI sales agent running in 15 minutes!

## Step 1: Sign In (1 minute)

1. Go to your WhatsApp AI Sales Agent dashboard
2. Click **Sign In**
3. Authenticate with your account

## Step 2: Configure WhatsApp (5 minutes)

### Get Your Meta Credentials

1. Go to [Meta Developers](https://developers.facebook.com)
2. Create or select your Meta App
3. Add WhatsApp product
4. Get your:
   - **Phone Number ID** (found in Phone Numbers section)
   - **Access Token** (generate in API Credentials)
   - **Business Account ID** (from Business Manager)

### Add to Application

1. In dashboard, go to **Settings**
2. Click **WhatsApp Configuration**
3. Enter your credentials:
   ```
   Business Phone Number ID: [Your Phone Number ID]
   Business Account ID: [Your Account ID]
   Access Token: [Your Access Token]
   Webhook Verify Token: my_secure_token_123
   ```
4. Click **Save**

## Step 3: Configure Your Agent (5 minutes)

1. Go to **Agent Settings**
2. Fill in basic info:
   ```
   Agent Name: Alex - Sales Assistant
   Response Style: Friendly
   Max Response Length: 500
   ```

3. Define personality (be specific!):
   ```
   You are a friendly and knowledgeable sales consultant who is 
   patient, enthusiastic, and focused on understanding customer 
   needs. You use clear language and always explain benefits in 
   terms of customer outcomes.
   ```

4. Write your sales script:
   ```
   1. Welcome customer warmly
   2. Ask about their needs
   3. Explain how you can help
   4. Suggest next step (demo, trial, etc.)
   ```

5. Add escalation keywords:
   ```
   help, urgent, problem, complaint, refund
   ```

6. Click **Save Configuration**

## Step 4: Test Your Setup (3 minutes)

1. From your personal WhatsApp, send a message to your business number
2. Wait for automatic response (should arrive within 5 seconds)
3. Go to **Conversations** tab
4. You should see your conversation there
5. Try sending another message and verify AI responds

## Step 5: Start Using (1 minute)

### Daily Workflow

**Morning:**
- Check **Conversations** for any escalated chats
- Review **Analytics** for overnight activity

**Throughout Day:**
- Monitor **Conversations** tab
- Send manual messages for high-value leads
- Handle escalated conversations

**End of Day:**
- Review **Analytics** dashboard
- Note any patterns or improvements needed

---

## Common First Steps

### Send Your First Manual Message

1. Go to **Conversations**
2. Click any conversation
3. Type a message in the input box
4. Click **Send**
5. Message appears in customer's WhatsApp immediately

### View Conversation History

1. Go to **Conversations**
2. Click on any conversation
3. Scroll to see full message history
4. Messages show timestamps and sender

### Check Your Performance

1. Go to **Analytics**
2. View key metrics:
   - Total conversations
   - AI responses sent
   - Lead qualification rate
   - Average response time

### Adjust Agent Behavior

1. Go to **Agent Settings**
2. Update personality or sales script
3. Click **Save Configuration**
4. Changes apply to new responses immediately

---

## Troubleshooting

### Agent Not Responding?

**Check 1:** Is auto-response enabled?
- Go to **Agent Settings**
- Verify "Enable Auto-Response" is ON

**Check 2:** Is conversation escalated?
- Go to **Conversations**
- If marked "Escalated", you need to send manual message

**Check 3:** Is WhatsApp configured correctly?
- Go to **Settings**
- Verify phone number ID and access token

### Messages Not Sending?

**Check 1:** Correct phone number format?
- Should include country code: +1234567890

**Check 2:** Customer hasn't blocked you?
- Ask customer to check blocked list

**Check 3:** Access token valid?
- Regenerate from Meta Business Manager

---

## Key Features to Try

### Feature 1: Automatic Responses
Send a customer message and watch AI respond automatically within seconds.

### Feature 2: Manual Override
For important customers, send your own personalized message.

### Feature 3: Escalation
Use a keyword like "help" or "urgent" and watch conversation escalate to you.

### Feature 4: Analytics
View how many conversations you've had and how many became qualified leads.

### Feature 5: Agent Customization
Change your agent's personality and watch how responses change.

---

## Next Steps

1. **Customize More:** Fine-tune agent personality based on real conversations
2. **Monitor Analytics:** Check daily to see what's working
3. **Add Keywords:** Update escalation keywords based on your needs
4. **Train Team:** Show your team how to use the dashboard
5. **Optimize:** Based on analytics, improve your sales script

---

## Need Help?

- **Setup Issues?** See WHATSAPP_SETUP_GUIDE.md
- **How to Use?** See USER_GUIDE.md
- **Technical Details?** See TECHNICAL_DOCUMENTATION.md

---

## Success Tips

✅ **DO:**
- Be specific in agent personality
- Test with sample messages
- Review conversations daily
- Update based on feedback
- Keep sales script concise

❌ **DON'T:**
- Use vague descriptions
- Ignore escalations
- Set response length too short
- Forget to test changes
- Neglect analytics

---

**You're all set! Your WhatsApp AI Sales Agent is ready to start engaging customers. 🚀**
