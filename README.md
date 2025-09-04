# AI Call Assistant

An AI-powered call assistant for NuVance Labs that handles incoming calls, analyzes caller intent using Claude AI, and routes calls appropriately.

## Project Structure

```
ai-call-assistant/
├── docs/
│   └── requirements.md          # Complete project requirements
├── app/
│   ├── api/
│   │   ├── voice/               # Twilio webhook endpoints
│   │   ├── process-speech/      
│   │   ├── call-status/         
│   │   ├── auth/                # Authentication endpoints
│   │   └── dashboard/           # Dashboard API endpoints
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── services/
│   ├── twilio.ts                # Twilio TwiML generation
│   ├── claude.ts                # Claude AI integration
│   └── database.ts              # Neon PostgreSQL operations
├── types/
│   ├── twilio.ts                # Twilio webhook types
│   └── claude.ts                # Claude response types
└── Configuration files...
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.local` and update with your API keys
   - Set up Twilio account and get credentials
   - Set up Neon PostgreSQL database
   - Get Anthropic Claude API key

3. **Initialize database:**
   ```bash
   npm run dev
   # Database tables will be created automatically
   ```

4. **Deploy to Vercel:**
   - Connect GitHub repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy and get webhook URL

5. **Configure Twilio webhooks:**
   - Set voice webhook URL to: `https://your-app.vercel.app/api/01-voice`

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```

## API Endpoints

### Twilio Webhooks
- `POST /api/01-voice` - Initial call handling
- `POST /api/02-process-speech` - Speech analysis and routing
- `POST /api/03-call-status` - Call completion events

### Dashboard API
- `POST /api/04-auth/login` - Admin authentication
- `GET /api/05-dashboard/calls` - Fetch call history
- `GET /api/05-dashboard/stats` - Get call statistics

## Features

- **AI-powered call routing** using Claude for intent analysis
- **Call screening** for Michael with AI-generated summaries
- **Sales appointment booking** with calendar integration
- **Real-time admin dashboard** for call monitoring
- **UK compliance** with call recording notifications
- **Professional call handling** with filtering of prank calls

## Tech Stack

- **Framework:** Next.js 14 with TypeScript
- **Hosting:** Vercel (free tier)
- **Database:** Neon PostgreSQL (free tier)
- **AI:** Anthropic Claude API
- **Telephony:** Twilio Voice API
- **Styling:** Tailwind CSS