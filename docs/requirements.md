# AI Call Assistant - Requirements Document

## Project Overview
An AI-powered call assistant for NuVance Labs that handles incoming calls, analyzes caller intent using Claude AI, and routes calls or takes appropriate actions. Built for demo purposes during job interviews.

## Functional Requirements

### User Stories

#### Story 1: Emma Direct Routing
**As a** caller  
**I want** to speak with Emma by name  
**So that** I can reach her for any reason  

**Acceptance Criteria:**
- When caller explicitly asks for Emma (any reason)
- System attempts to route call directly to Emma
- If Emma available: call connects
- If Emma not available AND sales-related: proceed to Story 2
- If Emma not available AND not sales: proceed to Story 3

#### Story 2: Emma Unavailable - Sales Callback
**As a** sales prospect  
**I want** to book a callback when Emma isn't available  
**So that** I can still get sales assistance  

**Acceptance Criteria:**
- When caller asked for Emma, she's unavailable, AND AI determines sales intent
- System responds: "Emma isn't available right now. I need to book you a callback. When would suit you?"
- System checks Michael's calendar for availability  
- System books sales appointment
- System logs in CRM: caller number, name, reason, timestamp
- Message sent to Emma about the scheduled callback

#### Story 3: Emma Unavailable - Try Michael
**As a** caller  
**I want** an alternative when Emma isn't available for non-sales matters  
**So that** I can still reach someone  

**Acceptance Criteria:**
- When caller asked for Emma, she's unavailable, AND not sales-related
- System asks: "Emma isn't available. Would you like to try Michael instead?"
- If yes: proceed to Story 4 (Michael routing)
- If no: proceed to Story 5 (message taking)
- Message sent to Emma (not Michael) since caller originally wanted Emma

#### Story 4: Michael Call Screening
**As** Michael (business owner)  
**I want** to screen incoming business calls  
**So that** I can decide whether to take them or have messages taken  

**Acceptance Criteria:**
- When caller has business inquiry for Michael (not Emma request, not sales)
- System dials Michael's mobile
- Michael hears: "I have [caller name/unknown] on the line regarding [topic]. Shall I let it through?"
- If Michael accepts: call connects directly
- If Michael declines or doesn't answer: proceed to Story 5 (message taking)

#### Story 5: Message Taking and Notification
**As a** caller  
**I want** to leave a message when no one is available  
**So that** my inquiry isn't lost  

**Acceptance Criteria:**
- When neither Emma nor Michael available, OR Michael declines screened call
- System says: "Please leave a brief message with your name and reason for calling"
- System captures message via STT
- If original request was for Emma: SMS sent to Emma with caller details and message
- If original request was for Michael: SMS sent to Michael with caller details and message
- System logs interaction in CRM with message content

#### Story 6: Non-Business Call Filtering
**As** Michael (business owner)  
**I want** prank calls and nonsense filtered out  
**So that** my time isn't wasted  

**Acceptance Criteria:**
- When AI determines intent is nonsense, prank, or irrelevant
- System responds: "Thank you for calling NuVance Labs" and hangs up
- No routing attempted
- Optional: Log as "filtered call" with reason

#### Story 7: Admin Dashboard Login
**As** Michael (admin)  
**I want** to securely access the admin dashboard  
**So that** I can monitor call activity and system performance  

**Acceptance Criteria:**
- Login page with username/password form
- Hardcoded credentials: username "admin", password from environment variable
- Successful login creates session and redirects to dashboard
- Invalid credentials show error message
- Session expires after 30 minutes of inactivity
- Logout button clears session

#### Story 8: View Call History
**As** Michael (admin)  
**I want** to see a table of recent calls  
**So that** I can review caller interactions and outcomes  

**Acceptance Criteria:**
- Dashboard displays calls table with columns: timestamp, caller number, caller name, intent, outcome, duration
- Paginated results (20 calls per page)
- Sortable by timestamp (newest first by default)
- Filter options: today/this week/all time
- Click on call shows full transcript and details

#### Story 9: Monitor Call Statistics
**As** Michael (admin)  
**I want** to see call statistics and system health  
**So that** I can understand call patterns and system performance  

**Acceptance Criteria:**
- Today's stats: total calls, successful routes, filtered calls, messages taken
- Route breakdown: calls to Emma, calls to Michael, sales bookings
- System health: last call time, webhook response times, API status
- Auto-refresh every 30 seconds without page reload

#### Story 10: Real-time Call Updates
**As** Michael (admin)  
**I want** to see new calls appear in real-time  
**So that** I can monitor live activity during peak times  

**Acceptance Criteria:**
- New calls appear in dashboard without manual refresh
- Live indicator shows "Call in progress" for active calls
- Toast notifications for new calls
- Call status updates in real-time (connecting, connected, completed)

#### Story 11: Call Recording Compliance
**As a** caller in the UK  
**I want** to be informed about call recording  
**So that** I can give informed consent  

**Acceptance Criteria:**
- First thing caller hears: "This call may be recorded and transcribed for service purposes"
- System proceeds with normal flow after notification
- All transcripts stored with consent timestamp

## Technical Requirements

### System Architecture
- **Frontend:** Next.js dashboard for admin call monitoring
- **Backend:** Next.js API routes handling Twilio webhooks and dashboard APIs
- **Database:** Neon PostgreSQL for call logs and session storage
- **AI:** Claude API for intent analysis
- **Calendar:** Google Calendar API for availability/booking
- **Telephony:** Twilio for call handling, STT, TTS
- **Notifications:** Twilio SMS for message alerts
- **CRM:** HubSpot for lead management

### API Endpoints

#### Twilio Webhook Endpoints
- `POST /api/voice` - Handle incoming call, play greeting
- `POST /api/process-speech` - Analyze speech and route (includes calendar checking internally)
- `POST /api/call-status` - Handle call completion/failure

#### Dashboard Frontend-Backend API Endpoints
- `POST /api/auth/login` - Authenticate admin user with hardcoded credentials
- `POST /api/auth/logout` - Clear admin session
- `GET /api/auth/session` - Check if current session is valid
- `GET /api/dashboard/calls` - Fetch paginated call history with filters
- `GET /api/dashboard/stats` - Get today's statistics and system health metrics
- `GET /api/dashboard/live` - Server-sent events for real-time call updates

### Services
- **TwilioService:** TwiML generation, call routing, SMS
- **ClaudeService:** Intent analysis and classification
- **CRMService:** HubSpot integration for lead logging
- **CalendarService:** Google Calendar integration
- **NotificationService:** SMS alerts to Michael
- **DatabaseService:** Neon PostgreSQL operations
- **AuthService:** Session management for dashboard

### Intent Classification
Claude API must classify caller intent into:
- `emma_request`: Explicit request for Emma (any reason)
- `sales_general`: Sales intent without specific person request → goes to Michael
- `business_general`: General business inquiry → goes to Michael  
- `nonsense`: Prank calls, irrelevant content → hang up
- `unclear`: Requires clarification → ask for more details

### Call Flow Logic
1. **Emma requested:** Try Emma first → if unavailable and sales → calendar booking → if unavailable and not sales → offer Michael
2. **Sales inquiry (no Emma request):** Book with Michael via calendar
3. **General business:** Route to Michael with screening
4. **Nonsense/prank:** Filter and hang up
5. **Anyone unavailable:** Take message and SMS appropriate person (Emma if originally for Emma, Michael otherwise)

## Non-Functional Requirements

### Performance
- Webhook response time: < 1 second
- Call routing delay: < 3 seconds
- Calendar availability check: < 2 seconds
- Dashboard load time: < 2 seconds

### Reliability
- Handle 10-20 concurrent calls (demo scale)
- Graceful degradation if external APIs fail
- Retry logic for failed call routing
- 99% uptime for webhook endpoints

### Security & Compliance
- UK call recording notification required
- Secure storage of transcripts (if retained)
- API key protection in environment variables
- Session-based auth for dashboard (30-minute expiry)
- Hardcoded admin credentials in environment variables

### Cost Constraints
- Twilio free trial (£11 credit)
- Vercel free tier hosting
- HubSpot free tier CRM
- Neon PostgreSQL free tier
- Google Calendar/Sheets free APIs
- Minimize Claude API usage (mock in development)

## Success Criteria
1. Successfully routes calls based on caller intent
2. Books sales appointments when appropriate
3. Filters out non-business calls effectively
4. Provides professional experience for legitimate callers
5. Admin dashboard shows real-time call monitoring
6. Demonstrates enterprise-grade code structure for interviews
7. Operates within free/trial tier limits

## Implementation Phases

### Phase 1: Basic Call Handling (Days 1-2)
- Set up Next.js project with TypeScript
- Create basic Twilio webhook endpoints
- Test with mock data and Twilio simulator

### Phase 2: AI Integration (Days 3-4)
- Integrate Claude API for intent analysis
- Implement call routing logic
- Test intent classification with sample transcripts

### Phase 3: External Integrations (Days 5-6)
- HubSpot CRM integration
- Google Calendar booking
- SMS notifications

### Phase 4: Dashboard Development (Days 7-8)
- Database setup with Neon
- Admin authentication system
- Call history and statistics display
- Real-time updates implementation

### Phase 5: Testing & Polish (Days 9+)
- End-to-end testing with live Twilio number
- Dashboard UI/UX refinement
- Demo preparation and refinement