# Pilimarket.com - Technical Architecture

## Project Structure

```
Pilimarket/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── config.py       # Configuration management
│   │   ├── database.py     # Database connection
│   │   ├── models/         # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── market.py
│   │   │   ├── forecast.py
│   │   │   ├── purchase.py
│   │   │   └── ...
│   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── market.py
│   │   │   └── ...
│   │   ├── api/            # API routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── markets.py
│   │   │   │   ├── forecasts.py
│   │   │   │   ├── purchases.py
│   │   │   │   ├── users.py
│   │   │   │   ├── leaderboard.py
│   │   │   │   └── admin.py
│   │   ├── dependencies.py # Shared dependencies
│   │   ├── middleware.py   # Custom middleware
│   │   ├── services/       # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── market_service.py
│   │   │   ├── forecast_service.py
│   │   │   ├── reputation_service.py
│   │   │   ├── badge_service.py
│   │   │   └── leaderboard_service.py
│   │   ├── utils/          # Utilities
│   │   │   ├── security.py
│   │   │   ├── cache.py
│   │   │   └── validators.py
│   │   └── tasks/          # Celery tasks
│   │       ├── reputation.py
│   │       ├── leaderboard.py
│   │       ├── notifications.py
│   │       └── moderation.py
│   ├── alembic/            # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/              # Backend tests
│   │   ├── test_auth.py
│   │   ├── test_markets.py
│   │   └── ...
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/               # Ionic 8 + React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/     # Reusable components
│   │   │   ├── MarketCard/
│   │   │   ├── ForecastSlip/
│   │   │   ├── LeaderboardWidget/
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── Markets/
│   │   │   ├── MarketDetail/
│   │   │   ├── Profile/
│   │   │   └── ...
│   │   ├── contexts/       # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/          # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useMarkets.ts
│   │   │   └── ...
│   │   ├── services/       # API clients
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── ...
│   │   ├── utils/          # Utilities
│   │   │   ├── storage.ts
│   │   │   └── formatters.ts
│   │   ├── types/          # TypeScript types
│   │   │   ├── user.ts
│   │   │   ├── market.ts
│   │   │   └── ...
│   │   └── styles/         # Global styles
│   │       └── tailwind.css
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── ionic.config.json
│   └── Dockerfile
│
├── docker-compose.yml      # Local development
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD workflows
├── docs/                   # Documentation
│   ├── API.md
│   └── DEPLOYMENT.md
├── PROJECT_PLAN.md
├── MVP_BREAKDOWN.md
└── README.md
```

---

## Technology Stack Details

### Backend

#### FastAPI
- **Why**: Modern, fast, async Python framework with automatic OpenAPI docs
- **Key Features**:
  - Automatic request validation with Pydantic
  - Async/await support
  - Built-in OpenAPI/Swagger docs
  - Type hints throughout

#### SQLAlchemy
- **Why**: Mature ORM with excellent PostgreSQL support
- **Version**: 2.0+ (async support)
- **Features**:
  - Async database operations
  - Relationship management
  - Migration support via Alembic

#### Alembic
- **Why**: Standard migration tool for SQLAlchemy
- **Usage**: Version control for database schema changes

#### Redis
- **Use Cases**:
  - Session storage
  - Caching (markets, leaderboards)
  - Rate limiting
  - Pub/sub for real-time updates
  - Celery broker

#### Celery
- **Why**: Robust task queue for background jobs
- **Broker**: Redis
- **Tasks**:
  - Reputation recalculation
  - Leaderboard updates
  - Email notifications
  - Payment webhook processing

#### JWT Authentication
- **Library**: `python-jose[cryptography]`
- **Tokens**:
  - Access token: 15 minutes expiry
  - Refresh token: 7 days expiry
- **Storage**: HTTP-only cookies (preferred) or secure localStorage

#### Stripe Integration
- **Library**: `stripe`
- **Features**:
  - Payment intents
  - Webhook handling
  - Test mode for development

### Frontend

#### Ionic 8 + React
- **Why**: Mobile-first framework with native-like experience
- **Features**:
  - Cross-platform (web, iOS, Android)
  - Rich UI components
  - Routing with React Router
  - Capacitor for native features (future)

#### React
- **Version**: 18+
- **State Management**: React Context API + hooks
- **Routing**: React Router v6

#### TailwindCSS
- **Why**: Utility-first CSS for rapid UI development
- **Configuration**: Custom theme matching Polymarket design
- **Plugins**: Forms, typography

#### TypeScript
- **Why**: Type safety and better developer experience
- **Strict mode**: Enabled

#### Axios
- **Why**: HTTP client with interceptors for auth
- **Features**:
  - Request/response interceptors
  - Automatic token refresh
  - Error handling

---

## Chip Economy

### Chip Value Definition
**1 Chip = 1 Philippine Peso (₱1.00)**

This equivalence is used for:
- Display purposes (showing chip values in peso format)
- Payment processing calculations
- Market volume and statistics display
- User balance representation

### Important Notes
- Chips are **virtual, non-redeemable tokens** with **no monetary value**
- The 1:1 ratio with Philippine Peso is for **reference purposes only**
- Chips **cannot be converted to cash** or redeemed
- All chip transactions are final and non-refundable
- See [CHIP_ECONOMY.md](../CHIP_ECONOMY.md) for detailed documentation

### Implementation
- Backend constant: `CHIP_TO_PESO_RATIO = 1.0` in `app/config.py`
- Database: Store chips as integers (number of chips)
- Frontend: Display as `₱X,XXX` or `X,XXX chips (₱X,XXX)`
- Payment: Charge ₱1.00 per chip purchased

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  chips bigint DEFAULT 0 CHECK (chips >= 0),
  reputation double precision DEFAULT 0 CHECK (reputation >= 0),
  badges jsonb DEFAULT '[]'::jsonb,
  role text DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'superadmin')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  last_active timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### markets
```sql
CREATE TABLE markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('election', 'crypto', 'entertainment', 'sports', 'politics', 'other')),
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open', 'suspended', 'resolved', 'cancelled')),
  resolution_outcome text,
  resolution_time timestamptz,
  max_points_per_user bigint DEFAULT 10000,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX idx_markets_slug ON markets(slug);
```

#### outcomes
```sql
CREATE TABLE outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES markets(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  total_points bigint DEFAULT 0 CHECK (total_points >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(market_id, name)
);

CREATE INDEX idx_outcomes_market ON outcomes(market_id);
```

#### forecasts
```sql
CREATE TABLE forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  market_id uuid REFERENCES markets(id) ON DELETE CASCADE NOT NULL,
  outcome_id uuid REFERENCES outcomes(id) ON DELETE CASCADE NOT NULL,
  points bigint NOT NULL CHECK (points > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  is_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, market_id) -- One forecast per user per market
);

CREATE INDEX idx_forecasts_user ON forecasts(user_id);
CREATE INDEX idx_forecasts_market ON forecasts(market_id);
CREATE INDEX idx_forecasts_outcome ON forecasts(outcome_id);
CREATE INDEX idx_forecasts_status ON forecasts(status);
CREATE INDEX idx_forecasts_created_at ON forecasts(created_at DESC);
```

#### purchases
```sql
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  provider text NOT NULL CHECK (provider IN ('stripe', 'gcash', 'paymaya')),
  chips_added bigint NOT NULL CHECK (chips_added > 0),
  provider_tx_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
```

#### resolutions
```sql
CREATE TABLE resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES markets(id) UNIQUE NOT NULL,
  outcome_id uuid REFERENCES outcomes(id) NOT NULL,
  resolved_by uuid REFERENCES users(id) NOT NULL,
  evidence_urls text[] NOT NULL CHECK (array_length(evidence_urls, 1) >= 1),
  resolution_note text NOT NULL,
  created_at timestamptz DEFAULT now()
  -- Immutable: no updates allowed
);

CREATE INDEX idx_resolutions_market ON resolutions(market_id);
CREATE INDEX idx_resolutions_created_at ON resolutions(created_at DESC);
```

#### activities
```sql
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('forecast_placed', 'market_resolved', 'badge_earned', 'market_created', 'user_registered')),
  market_id uuid REFERENCES markets(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_market ON activities(market_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
```

#### notifications
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('market_resolved', 'badge_earned', 'new_market', 'forecast_reminder')),
  message text NOT NULL,
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## API Design Patterns

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "errors": []
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### Authentication
- JWT tokens in Authorization header: `Bearer <token>`
- Refresh token rotation
- Token stored in HTTP-only cookies (preferred) or secure storage

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Filtering & Sorting
- Query parameters: `?category=election&status=open&sort=created_at&order=desc`
- Standardized filter format

---

## Caching Strategy

### Redis Keys
- `market:list:{category}:{status}:{page}` - TTL: 5 minutes
- `market:detail:{market_id}` - TTL: 60 seconds
- `leaderboard:{period}:{category}` - TTL: 5 minutes (updated by background job)
- `user:profile:{user_id}` - TTL: 10 minutes
- `ratelimit:user:{user_id}:{window}` - TTL: window duration

### Cache Invalidation
- On market update: invalidate market cache
- On forecast placement: invalidate market detail cache
- On resolution: invalidate market cache and leaderboard cache
- Background job: warm cache for popular markets

---

## Background Jobs (Celery)

### Job Definitions

#### `recompute_reputation(user_id: UUID)`
- **Trigger**: After market resolution (if user had forecast)
- **Frequency**: On-demand
- **Task**: Calculate new reputation score, update user, check badges

#### `recompute_leaderboard(period: str, category: str | None)`
- **Trigger**: Scheduled (every 5 minutes)
- **Frequency**: Periodic
- **Task**: Calculate leaderboard scores, store in Redis

#### `check_and_award_badges(user_id: UUID)`
- **Trigger**: After reputation update
- **Frequency**: On-demand
- **Task**: Check badge eligibility, award badges

#### `process_payment_webhook(webhook_data: dict)`
- **Trigger**: Stripe webhook
- **Frequency**: On-demand
- **Task**: Verify webhook, credit chips, send confirmation

#### `send_notifications(notification_type: str, user_id: UUID, data: dict)`
- **Trigger**: Various events
- **Frequency**: On-demand
- **Task**: Create notification record, send email (optional)

#### `check_for_suspicious_activity()`
- **Trigger**: Scheduled (every hour)
- **Frequency**: Periodic
- **Task**: Check for fraud patterns, flag suspicious accounts

---

## Security Measures

### Authentication & Authorization
- Password hashing: Argon2id (or bcrypt)
- JWT tokens with short expiry
- Refresh token rotation
- Role-based access control (RBAC)
- Admin-only endpoints protected

### Input Validation
- Pydantic schemas for all inputs
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (input sanitization)
- CSRF protection (tokens)

### Rate Limiting
- Auth endpoints: 10 requests/minute
- Forecast placement: 10 requests/minute
- Purchase: 5 requests/hour
- General API: 100 requests/minute
- Per-IP and per-user limits

### Data Protection
- HTTPS everywhere
- Secure cookie configuration
- Password never logged
- Sensitive data encrypted at rest
- Audit logs for admin actions

### Fraud Prevention
- Device fingerprinting
- IP-based checks
- Purchase amount limits
- Suspicious pattern detection
- Account flagging system

---

## Real-time Updates

### Options
1. **Polling** (MVP): Frontend polls API every 5 seconds
2. **WebSocket** (Post-MVP): Socket.IO for real-time updates
3. **Server-Sent Events** (Alternative): One-way updates from server

### Implementation (MVP - Polling)
- React hooks for polling
- Debounced updates
- Cache-aware polling (only when needed)

### Implementation (Post-MVP - WebSocket)
- Socket.IO server
- Redis pub/sub for broadcasting
- Room-based subscriptions (per market)
- Reconnection handling

---

## Error Handling

### Backend
- Standardized error responses
- Error logging (structured logs)
- Error tracking (Sentry)
- Graceful degradation

### Frontend
- Error boundaries
- User-friendly error messages
- Retry logic for failed requests
- Offline detection

---

## Testing Strategy

### Backend Tests
- **Unit tests**: Services, utilities (pytest)
- **Integration tests**: API endpoints (pytest + TestClient)
- **Database tests**: Transactions, constraints
- **Coverage target**: >70%

### Frontend Tests
- **Unit tests**: Components, hooks (Jest + React Testing Library)
- **Integration tests**: User flows
- **E2E tests**: Critical paths (Playwright)
- **Coverage target**: >60%

### Test Data
- Fixtures for common data
- Factory pattern for test objects
- Database seeding for integration tests

---

## Deployment Architecture

### Development
- Local PostgreSQL (existing: `dev_Pilimarket`)
- Local Redis
- Docker Compose for services (optional)
- Hot reload for frontend and backend

### Staging
- Docker containers
- PostgreSQL database
- Redis instance
- Celery workers
- CI/CD automated deployment

### Production
- Container orchestration (Docker Swarm or Kubernetes)
- PostgreSQL (managed or self-hosted)
- Redis cluster
- Celery workers (scaled)
- Load balancer
- CDN for static assets
- Monitoring and logging

---

## Monitoring & Observability

### Application Monitoring
- **Uptime monitoring**: Health check endpoints
- **Performance monitoring**: Response times, database queries
- **Error tracking**: Sentry integration
- **Log aggregation**: Structured logging

### Metrics
- API response times
- Database query performance
- Cache hit rates
- Background job execution times
- User activity metrics

### Alerts
- High error rates
- Slow response times
- Database connection issues
- Background job failures
- Payment processing issues

---

## Development Workflow

### Git Workflow
- Main branch: `main` (production)
- Development branch: `develop`
- Feature branches: `feature/feature-name`
- Hotfix branches: `hotfix/issue-name`

### Code Quality
- Pre-commit hooks (Black, Ruff, ESLint, Prettier)
- Code reviews required
- Automated testing in CI
- Linting in CI

### Environment Variables
- `.env.example` files for both frontend and backend
- Never commit `.env` files
- Use environment-specific configs

---

## Performance Optimization

### Backend
- Database query optimization (N+1 prevention)
- Connection pooling
- Async operations where possible
- Caching strategy
- Background job processing

### Frontend
- Code splitting
- Lazy loading routes
- Image optimization
- Bundle size optimization
- Service worker for caching (future)

### Database
- Proper indexes
- Query optimization
- Connection pooling
- Read replicas (future)

---

## Future Enhancements

### Phase 2 Features
- WebSocket real-time updates
- Mobile app (Ionic Capacitor)
- Advanced analytics dashboard
- Social features (follow users, comments)
- Market categories expansion
- Advanced badge system
- Referral program
- Email notifications
- Push notifications (mobile)

### Technical Improvements
- GraphQL API (alternative to REST)
- Microservices architecture (if needed)
- Event sourcing for audit trail
- Advanced caching (CDN)
- Database read replicas
- Horizontal scaling

---

## Notes

- Database already exists: `dev_Pilimarket`, user: `andersonbond`
- User prefers not to use Docker for local development
- Focus on mobile-first design
- Polymarket UI/UX as design inspiration
- Philippine market focus

