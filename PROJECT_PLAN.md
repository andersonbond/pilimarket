# Pilimarket.com - Project Plan & MVP Breakdown

## Project Overview
A Philippine prediction market platform where users purchase non-redeemable virtual chips to place forecasts on questions (markets). Focus on Filipino elections and topical markets. Inspired by Polymarket UI/UX.

### Chip Economy
- **1 Chip = 1 Philippine Peso (₱1.00)** - for reference and display purposes only
- Chips are virtual, non-redeemable tokens
- Chips have no monetary value and cannot be converted to cash
- Used solely for prediction market participation and reputation building

## Technology Stack
- **Frontend**: Ionic 8 + React, TailwindCSS
- **Backend**: Python (FastAPI)
- **Database**: PostgreSQL (dev_Pilimarket, user: andersonbond)
- **Cache/Session**: Redis
- **Background Jobs**: Celery + Redis broker
- **Auth**: JWT (access + refresh tokens)
- **Payment**: Stripe
- **Hosting**: Docker
- **CI/CD**: GitHub Actions

---

## MVP Phases

### Phase 0: Project Setup & Infrastructure (Week 1)
**Goal**: Set up development environment and project structure

#### Tasks:
1. **Project Structure Setup**
   - Initialize Ionic 8 + React frontend project
   - Initialize FastAPI backend project
   - Set up monorepo or separate repos structure
   - Configure ESLint, Prettier, Black, Ruff
   - Set up Git repository and .gitignore

2. **Database Setup**
   - Create database schema (users, markets, outcomes, forecasts, purchases)
   - Set up Alembic for migrations
   - Create initial migration files
   - Set up database connection pooling

3. **Infrastructure Setup**
   - Docker Compose for local development (PostgreSQL, Redis)
   - Environment variable management (.env files)
   - Basic logging configuration
   - Health check endpoints

4. **Development Tools**
   - Set up pre-commit hooks
   - Configure VS Code/Cursor settings
   - Set up testing frameworks (Jest for frontend, pytest for backend)

**Deliverables**:
- ✅ Working local development environment
- ✅ Database schema created and migrated
- ✅ Basic project structure in place
- ✅ Docker Compose running PostgreSQL + Redis

---

### Phase 1: Core Authentication & User Management (Week 2)
**Goal**: Users can register, login, and manage basic profiles

#### Backend Tasks:
1. **Authentication System**
   - User registration endpoint (POST /api/v1/auth/register)
   - Login endpoint (POST /api/v1/auth/login) with JWT
   - Refresh token endpoint (POST /api/v1/auth/refresh)
   - Password reset flow (forgot password)
   - Password hashing with Argon2/bcrypt
   - User model with email, password_hash, display_name, bio

2. **User Profile API**
   - GET /api/v1/users/:id/profile
   - PATCH /api/v1/users/:me (update own profile)
   - Basic user stats (total forecasts, chips balance)

3. **Security**
   - Rate limiting middleware
   - CORS configuration
   - Input validation with Pydantic
   - SQL injection prevention (SQLAlchemy ORM)

#### Frontend Tasks:
1. **Auth Pages**
   - Login page (Ionic + React)
   - Sign up page
   - Forgot password page
   - Password reset page

2. **Auth State Management**
   - JWT token storage (secure storage)
   - Auth context/provider
   - Protected route guards
   - Auto-refresh token logic

3. **User Profile UI**
   - Basic profile page
   - Edit profile modal/page

**Deliverables**:
- ✅ Users can register and login
- ✅ JWT authentication working
- ✅ Protected routes on frontend
- ✅ Basic user profile page

---

### Phase 2: Chip Purchase System (Week 3)
**Goal**: Users can purchase non-redeemable chips via Stripe

#### Backend Tasks:
1. **Purchase Model & API**
   - Purchase model (user_id, amount_cents, provider, chips_added, provider_tx_id)
   - POST /api/v1/purchases/checkout (create Stripe payment intent)
   - POST /api/v1/purchases/webhook (Stripe webhook handler)
   - Chip credit logic (atomic transaction)
   - Purchase history endpoint

2. **Stripe Integration**
   - Stripe SDK setup
   - Payment intent creation
   - Webhook signature verification
   - Error handling and retries

3. **Chip Wallet**
   - User chips balance tracking
   - Chip transaction log
   - Daily purchase limits
   - Anti-fraud checks (IP, device fingerprinting)

4. **Legal Compliance**
   - Clear labeling: "Non-redeemable Forecast Points"
   - Disclaimer in purchase flow
   - Terms of Service page content

#### Frontend Tasks:
1. **Purchase Flow**
   - Chip purchase page/modal
   - Stripe payment form integration
   - Purchase confirmation with disclaimer
   - Purchase history view
   - Chip balance display (header/navbar)

2. **Legal Pages**
   - Terms of Service page
   - Privacy Policy page
   - FAQ page
   - Disclaimer page

**Deliverables**:
- ✅ Users can purchase chips via Stripe
- ✅ Chips credited to account
- ✅ Clear non-redeemable disclaimers
- ✅ Legal pages in place

---

### Phase 3: Market System - Core (Week 4)
**Goal**: Admins can create markets, users can view markets

#### Backend Tasks:
1. **Market CRUD**
   - Market model (title, slug, description, category, status, resolution_outcome)
   - Outcome model (market_id, name, total_points)
   - GET /api/v1/markets (list with filters: category, status)
   - GET /api/v1/markets/:id (market detail with outcomes)
   - POST /api/v1/markets (admin only - create market)
   - PATCH /api/v1/markets/:id (admin - update market)
   - Market slug generation
   - Market status workflow (open, suspended, resolved, cancelled)

2. **Market Caching**
   - Redis cache for market list (30s-5m TTL)
   - Redis cache for market detail (60s TTL)
   - Cache invalidation on updates

3. **Admin Authorization**
   - Role-based access control (RBAC)
   - Admin middleware
   - Admin user seeding

#### Frontend Tasks:
1. **Market List Page**
   - MarketCard component (title, category, consensus %, status)
   - Filtering by category and status
   - Search functionality
   - Pagination or infinite scroll

2. **Market Detail Page**
   - Market information display
   - Outcomes list with current points distribution
   - Consensus percentage calculation
   - Category tags
   - Status indicators

3. **Admin Market Creation**
   - Create market form (admin only)
   - Add outcomes
   - Preview market

**Deliverables**:
- ✅ Admins can create markets
- ✅ Users can browse and view markets
- ✅ Market caching working
- ✅ Basic market UI

---

### Phase 4: Forecast System (Week 5)
**Goal**: Users can place forecasts on markets using chips

#### Backend Tasks:
1. **Forecast API**
   - Forecast model (user_id, market_id, outcome_id, points, created_at)
   - POST /api/v1/markets/:id/forecast (place forecast)
   - GET /api/v1/users/:id/forecasts (forecast history)
   - GET /api/v1/markets/:id/forecasts (market forecasts)
   - Atomic transaction: debit chips + create forecast + update outcome.total_points
   - Validation: user has enough chips, market is open, points > 0
   - Per-market max points per user limit

2. **Forecast Updates**
   - Allow users to update forecasts (within limits)
   - Recalculate outcome totals
   - Audit trail for forecast changes

3. **Real-time Updates**
   - Redis pub/sub for market updates
   - WebSocket/Socket.IO setup (optional for MVP, can use polling)
   - Market consensus calculation

4. **Anti-abuse**
   - Rate limiting on forecast placement
   - Flag suspicious patterns
   - Per-market and daily limits

#### Frontend Tasks:
1. **Forecast UI**
   - ForecastSlip component (points input, outcome selection)
   - Place forecast button with confirmation modal
   - Non-redeemable reminder in confirmation
   - Current forecast display (if user already forecasted)
   - Update forecast functionality

2. **Market Detail Enhancements**
   - Interactive forecast placement UI
   - Real-time consensus updates (polling or WebSocket)
   - User's current forecast display
   - Points allocation visualization

3. **Forecast History**
   - User forecast history page
   - Filter by market, outcome, date
   - Status indicators (pending, resolved, won/lost)

**Deliverables**:
- ✅ Users can place forecasts
- ✅ Chips debited correctly
- ✅ Market consensus updates
- ✅ Forecast history view

---

### Phase 5: Market Resolution System (Week 6)
**Goal**: Admins can resolve markets with evidence

#### Backend Tasks:
1. **Resolution Engine**
   - POST /api/v1/markets/:id/resolve (admin only)
   - Resolution model/log (market_id, outcome_id, resolved_by, evidence_urls, resolution_note, timestamp)
   - Market status update to "resolved"
   - Immutable resolution records
   - Evidence URL validation

2. **Resolution Workflow**
   - Require evidence URLs (minimum 2 for elections)
   - Resolution note/explanation
   - Dispute window (X days after resolution)
   - Re-open market capability (admin)

3. **Forecast Scoring**
   - Calculate user accuracy after resolution
   - Mark forecasts as won/lost
   - Update user stats
   - Trigger reputation recalculation (background job)

4. **Audit Trail**
   - Resolution history table
   - Market state snapshot at resolution
   - Log all resolution actions

#### Frontend Tasks:
1. **Admin Resolution UI**
   - Resolve market form (admin panel)
   - Evidence URL inputs
   - Resolution note textarea
   - Outcome selection
   - Preview resolution

2. **Market Resolution Display**
   - Resolved market indicator
   - Resolution details (evidence, note, date)
   - Outcome highlight
   - User forecast result (won/lost)

3. **Dispute System (Basic)**
   - Dispute button (if within window)
   - Dispute form
   - Dispute status display

**Deliverables**:
- ✅ Admins can resolve markets
- ✅ Resolution with evidence required
- ✅ Forecasts marked as won/lost
- ✅ Resolution history visible

---

### Phase 6: Reputation & Badges System (Week 7)
**Goal**: Calculate reputation scores and award badges

#### Backend Tasks:
1. **Reputation Engine**
   - Reputation calculation formula:
     - `reputation = 0.7 * accuracy_score + 0.3 * log(1 + total_forecast_points)`
   - Brier score calculation for accuracy
   - Log loss calculation (alternative)
   - Update user reputation on market resolution
   - Background job: recompute_reputation() (Celery)

2. **Badge System**
   - Badge definitions (Newbie, Accurate, Climber, Specialist)
   - Badge award logic
   - User badges storage (JSONB array)
   - Badge eligibility checks
   - Background job: check_and_award_badges()

3. **Badge Types Implementation**
   - Newbie: 0-10 forecasts
   - Accurate: Brier score < threshold
   - Climber: Consistent improvement over time
   - Specialist: Top X% in category (e.g., elections)

4. **API Endpoints**
   - GET /api/v1/users/:id/badges
   - GET /api/v1/users/:id/reputation-history

#### Frontend Tasks:
1. **Reputation Display**
   - Reputation score on profile
   - Reputation meter/visualization
   - Reputation history chart

2. **Badge Display**
   - Badge collection on profile
   - Badge icons/designs
   - Badge tooltips (how earned)
   - Badge showcase

3. **Profile Enhancements**
   - Reputation section
   - Badges section
   - Stats breakdown (accuracy, total forecasts, etc.)

**Deliverables**:
- ✅ Reputation scores calculated
- ✅ Badges awarded automatically
- ✅ Reputation and badges visible on profiles

---

### Phase 7: Leaderboard System (Week 8)
**Goal**: Global and category-specific leaderboards

#### Backend Tasks:
1. **Leaderboard Calculation**
   - LeaderboardRankScore formula:
     - Normalized combination of reputation, streaks, activity
   - Global leaderboard
   - Weekly leaderboard
   - Category leaderboards (elections, etc.)
   - Background job: recompute_leaderboard() (runs every 1-5 minutes)
   - Redis caching: leaderboard:{period}:{category}

2. **Leaderboard API**
   - GET /api/v1/leaderboard?period=weekly&category=election
   - Pagination support
   - User's rank in leaderboard
   - Leaderboard history

3. **Streak Calculation**
   - Winning streak tracking
   - Activity streak (daily forecasts)
   - Streak bonuses in leaderboard score

#### Frontend Tasks:
1. **Leaderboard Pages**
   - Global leaderboard view
   - Weekly leaderboard
   - Category leaderboards (elections, etc.)
   - Leaderboard filters (period, category)
   - User rank highlight

2. **Leaderboard Widgets**
   - Homepage leaderboard widget
   - Top N users display
   - "Compete now" CTA
   - Leaderboard badges/medals

3. **Profile Leaderboard Stats**
   - Current rank display
   - Rank history
   - Category rankings

**Deliverables**:
- ✅ Leaderboards calculated and cached
- ✅ Leaderboard pages functional
- ✅ Homepage leaderboard widget

---

### Phase 8: Activity Feed & Notifications (Week 9)
**Goal**: Users see activity feed and receive notifications

#### Backend Tasks:
1. **Activity Feed**
   - Activity model (user_id, activity_type, market_id, metadata, created_at)
   - Activity types: forecast_placed, market_resolved, badge_earned, etc.
   - GET /api/v1/activity/feed (user's feed)
   - GET /api/v1/activity/global (global feed)
   - Activity aggregation and pagination

2. **Notification System**
   - Notification model (user_id, type, message, read, created_at)
   - Notification types: market_resolved, badge_earned, new_market, etc.
   - GET /api/v1/notifications (user notifications)
   - POST /api/v1/notifications/:id/read (mark as read)
   - Background job: send_notifications() (email + in-app)

3. **Email Notifications**
   - Email templates (market resolved, badge earned, etc.)
   - Email service integration (SendGrid/SES)
   - Unsubscribe handling

#### Frontend Tasks:
1. **Activity Feed UI**
   - Activity feed page
   - Activity cards (forecast placed, market resolved, etc.)
   - Filter by activity type
   - Infinite scroll

2. **Notifications UI**
   - Notification bell/icon (header)
   - Notification dropdown/modal
   - Notification list page
   - Mark as read functionality
   - Notification badges (unread count)

3. **Homepage Activity**
   - Recent activity widget
   - Top forecasters widget
   - Featured markets

**Deliverables**:
- ✅ Activity feed functional
- ✅ In-app notifications working
- ✅ Email notifications (optional for MVP)

---

### Phase 9: Admin Panel (Week 10)
**Goal**: Comprehensive admin tools for moderation and management

#### Backend Tasks:
1. **Admin APIs**
   - GET /api/v1/admin/flagged (flagged accounts/forecasts)
   - POST /api/v1/admin/markets/:id/suspend
   - POST /api/v1/admin/users/:id/ban
   - POST /api/v1/admin/users/:id/freeze-chips
   - GET /api/v1/admin/stats (dashboard stats)
   - GET /api/v1/admin/users (user management)
   - GET /api/v1/admin/purchases (purchase monitoring)

2. **Moderation Tools**
   - Auto-flagging logic (large transfers, multiple accounts, rapid changes)
   - Manual flag/unflag
   - User ban/suspend
   - Market suspension/cancellation
   - Chip freeze/unfreeze

3. **Admin Dashboard Stats**
   - Total users, markets, forecasts
   - Revenue metrics
   - Active users
   - Flagged items count

#### Frontend Tasks:
1. **Admin Dashboard**
   - Admin login/access
   - Dashboard overview (stats, charts)
   - User management table
   - Market management table
   - Purchase monitoring

2. **Moderation UI**
   - Flagged items queue
   - User action panel (ban, suspend, freeze)
   - Market action panel (suspend, cancel, resolve)
   - Audit log viewer

3. **Admin Market Tools**
   - Bulk market operations
   - Market import/export
   - Market analytics

**Deliverables**:
- ✅ Admin panel functional
- ✅ Moderation tools working
- ✅ Admin dashboard with stats

---

### Phase 10: Polish, Testing & Deployment (Week 11-12)
**Goal**: Production-ready application

#### Tasks:
1. **UI/UX Polish**
   - Polymarket-inspired design implementation
   - Mobile-first responsive design
   - Accessibility improvements
   - Loading states and error handling
   - Microcopy improvements (non-redeemable reminders)

2. **Performance Optimization**
   - Frontend code splitting
   - Image optimization
   - Database query optimization
   - Redis caching strategy refinement
   - CDN setup (if needed)

3. **Testing**
   - Unit tests (backend and frontend)
   - Integration tests
   - E2E tests (Playwright/Cypress)
   - Load testing
   - Security testing

4. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - README files
   - Deployment guide
   - Admin guide

5. **CI/CD Setup**
   - GitHub Actions workflows
   - Automated testing
   - Docker image builds
   - Staging deployment
   - Production deployment

6. **Security Hardening**
   - Security headers (CSP, XSS protection)
   - Rate limiting refinement
   - Input sanitization
   - SQL injection prevention
   - XSS prevention
   - CSRF protection

7. **Monitoring & Logging**
   - Error tracking (Sentry)
   - Application monitoring
   - Database monitoring
   - Log aggregation

**Deliverables**:
- ✅ Production-ready application
- ✅ Comprehensive test coverage
- ✅ CI/CD pipeline
- ✅ Monitoring in place

---

## MVP Feature Prioritization

### Must-Have (Core MVP):
1. ✅ User authentication
2. ✅ Chip purchase (Stripe)
3. ✅ Market creation (admin)
4. ✅ Market browsing
5. ✅ Forecast placement
6. ✅ Market resolution (admin)
7. ✅ Basic reputation calculation
8. ✅ Basic leaderboard
9. ✅ Legal pages (TOS, Privacy, Disclaimer)

### Nice-to-Have (Post-MVP):
1. Real-time updates (WebSocket)
2. Advanced badges
3. Email notifications
4. Dispute system
5. Advanced analytics
6. Social sharing
7. Mobile app (Ionic native)

---

## Database Schema Summary

### Core Tables:
- `users` - User accounts, chips, reputation, badges
- `markets` - Prediction markets
- `outcomes` - Market outcomes (YES/NO or named)
- `forecasts` - User forecasts/allocations
- `purchases` - Chip purchase transactions
- `resolutions` - Market resolution records
- `activities` - Activity feed entries
- `notifications` - User notifications
- `badges` - Badge definitions (optional separate table)

### Indexes:
- Market status, user forecasts, outcomes by market
- User purchases, activities, notifications

---

## API Endpoint Summary

### Auth:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password

### Markets:
- GET /api/v1/markets
- GET /api/v1/markets/:id
- POST /api/v1/markets (admin)
- PATCH /api/v1/markets/:id (admin)
- POST /api/v1/markets/:id/resolve (admin)

### Forecasts:
- POST /api/v1/markets/:id/forecast
- GET /api/v1/users/:id/forecasts
- GET /api/v1/markets/:id/forecasts

### Purchases:
- POST /api/v1/purchases/checkout
- POST /api/v1/purchases/webhook
- GET /api/v1/purchases (user's purchases)

### Users:
- GET /api/v1/users/:id/profile
- PATCH /api/v1/users/me
- GET /api/v1/users/:id/badges

### Leaderboards:
- GET /api/v1/leaderboard

### Activity:
- GET /api/v1/activity/feed
- GET /api/v1/activity/global

### Notifications:
- GET /api/v1/notifications
- POST /api/v1/notifications/:id/read

### Admin:
- GET /api/v1/admin/flagged
- POST /api/v1/admin/markets/:id/suspend
- POST /api/v1/admin/users/:id/ban
- GET /api/v1/admin/stats

---

## Background Jobs (Celery)

1. **recompute_reputation()** - Runs after market resolution
2. **recompute_leaderboard()** - Runs every 1-5 minutes
3. **check_and_award_badges()** - Runs periodically
4. **process_payment_webhook()** - Processes Stripe webhooks
5. **send_notifications()** - Sends email and in-app notifications
6. **archive_old_markets()** - Data hygiene
7. **update_market_cache()** - Refreshes market cache

---

## Risk Mitigation

### Legal Risks:
- ✅ Clear TOS stating chips are non-redeemable
- ✅ Phrase markets as predictions, not bets
- ✅ Legal review recommended before launch

### Technical Risks:
- ✅ Database backup strategy
- ✅ Rate limiting to prevent abuse
- ✅ Fraud detection for purchases
- ✅ Scalability planning (caching, CDN)

### Business Risks:
- ✅ User acquisition strategy
- ✅ Market creation strategy (quality over quantity)
- ✅ Moderation to prevent spam/abuse

---

## Next Steps

1. **Review this plan** and adjust priorities
2. **Set up Phase 0** (project structure)
3. **Begin Phase 1** (authentication)
4. **Iterate** based on feedback

---

## Notes

- Database already exists: `dev_Pilimarket`, user: `andersonbond`
- User prefers not to use Docker for local development (memory)
- Focus on mobile-first design (Ionic)
- Polymarket UI/UX as design inspiration
- Philippine market focus (elections, topical events)

