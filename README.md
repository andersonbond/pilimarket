# Pilimarket.com

A Philippine prediction market platform where users purchase non-redeemable virtual chips to place forecasts on questions (markets). Focus on Filipino elections and topical markets.

**Status**: Planning Phase - Ready for Implementation

## 📋 Project Overview

Pilimarket is a forecasting platform inspired by Polymarket, designed specifically for the Philippine market. Users purchase virtual chips (non-redeemable) to place forecasts on various markets, including elections, crypto, entertainment, and more.

### Key Features
- 🎯 Prediction markets with multiple outcomes
- 💰 Virtual chip economy (non-redeemable)
- 🏆 Reputation and badge system
- 📊 Leaderboards (global, weekly, category-specific)
- 👤 User profiles and activity feeds
- 🔔 Notifications system
- 🛡️ Admin panel for moderation

### Chip Economy
- **1 Chip = 1 Philippine Peso (₱1.00)**
- Chips are virtual, non-redeemable tokens used for forecasting
- Chips have no monetary value and cannot be converted to cash
- Used solely for prediction market participation and reputation building

### Legal & Compliance
- Chips are **non-redeemable** and have **no monetary value**
- Markets are phrased as **predictions/forecasts**, not bets
- Clear Terms of Service and disclaimers
- Strict moderation for election markets

## 🛠️ Technology Stack

### Frontend
- **Ionic 8** + **React** (TypeScript)
- **TailwindCSS** for styling
- **Axios** for API calls
- Mobile-first responsive design

### Backend
- **FastAPI** (Python)
- **PostgreSQL** database
- **Redis** for caching and sessions
- **Celery** for background jobs
- **JWT** authentication
- **Stripe** for payments

### Infrastructure
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Redis** as Celery broker

## 📁 Project Structure

```
Pilimarket/
├── backend/          # FastAPI backend
├── frontend/         # Ionic 8 + React frontend
├── docs/             # Documentation
├── PROJECT_PLAN.md   # High-level project plan
├── MVP_BREAKDOWN.md  # Detailed MVP breakdown
└── TECHNICAL_ARCHITECTURE.md  # Technical details
```

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - High-level project plan with 10 phases
- **[MVP_BREAKDOWN.md](./MVP_BREAKDOWN.md)** - Detailed MVP breakdown with deliverables and acceptance criteria
- **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** - Technical architecture, database schema, API design
- **[CHIP_ECONOMY.md](./CHIP_ECONOMY.md)** - Chip economy documentation (1 Chip = ₱1.00)

## 🚀 Getting Started

### Prerequisites

- **PostgreSQL** (already set up: `dev_Pilimarket`, user: `andersonbond`)
- **Redis** (for caching and background jobs)
- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **Stripe account** (for payments)

### Development Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm start
```

#### 3. Redis Setup

```bash
# Start Redis (if not running)
redis-server

# Or using Docker (optional)
docker run -d -p 6379:6379 redis:alpine
```

#### 4. Celery Worker Setup

```bash
# From backend directory
celery -A app.tasks.celery_app worker --loglevel=info
```

## 📊 Database Setup

The database `dev_Pilimarket` already exists. Run migrations to create tables:

```bash
cd backend
alembic upgrade head
```

## 🎯 MVP Phases

The project is organized into 10 phases:

1. **Phase 0**: Project Setup & Infrastructure
2. **Phase 1**: Core Authentication & User Management
3. **Phase 2**: Chip Purchase System
4. **Phase 3**: Market System - Core
5. **Phase 4**: Forecast System
6. **Phase 5**: Market Resolution System
7. **Phase 6**: Reputation & Badges System
8. **Phase 7**: Leaderboard System
9. **Phase 8**: Activity Feed & Notifications
10. **Phase 9**: Admin Panel
11. **Phase 10**: Polish, Testing & Deployment

See [MVP_BREAKDOWN.md](./MVP_BREAKDOWN.md) for detailed deliverables.

## 🔑 Key API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token

### Markets
- `GET /api/v1/markets` - List markets
- `GET /api/v1/markets/:id` - Market details
- `POST /api/v1/markets` - Create market (admin)

### Forecasts
- `POST /api/v1/markets/:id/forecast` - Place forecast
- `GET /api/v1/users/:id/forecasts` - User forecast history

### Purchases
- `POST /api/v1/purchases/checkout` - Create payment intent
- `POST /api/v1/purchases/webhook` - Stripe webhook

### Leaderboards
- `GET /api/v1/leaderboard` - Get leaderboard

See [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) for full API documentation.

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚢 Deployment

### Staging
- Automated deployment via GitHub Actions
- Docker containers
- Environment-specific configurations

### Production
- Container orchestration
- Load balancing
- CDN for static assets
- Monitoring and logging

See deployment guide in `docs/DEPLOYMENT.md` (to be created).

## 📝 Development Guidelines

### Code Style
- **Backend**: Black, Ruff (Python)
- **Frontend**: ESLint, Prettier (TypeScript/React)
- Pre-commit hooks enforce style

### Git Workflow
- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- Code reviews required

### Commit Messages
- Follow conventional commits
- Clear, descriptive messages

## 🔒 Security

- JWT authentication with refresh tokens
- Password hashing with Argon2
- Rate limiting on all endpoints
- Input validation with Pydantic
- SQL injection prevention (SQLAlchemy ORM)
- XSS and CSRF protection
- HTTPS everywhere

## 📈 Monitoring

- Error tracking: Sentry
- Application monitoring
- Database monitoring
- Log aggregation
- Performance metrics

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

[To be determined]

## 🎨 Design Inspiration

UI/UX inspired by [Polymarket.com](https://polymarket.com/)

## 📞 Support

[Contact information to be added]

## 🗺️ Roadmap

### MVP (Weeks 1-12)
- Core features: Auth, Markets, Forecasts, Purchases
- Reputation and badges
- Leaderboards
- Admin panel

### Post-MVP
- Real-time updates (WebSocket)
- Mobile app (Ionic Capacitor)
- Advanced analytics
- Social features
- Email notifications

## ⚠️ Important Notes

- **Chip Value**: 1 Chip = 1 Philippine Peso (₱1.00) - for reference and display purposes only
- **Chips are non-redeemable** - clearly stated throughout the application
- **No cash prizes** - leaderboards provide honorific prizes only
- **Legal compliance** - TOS must state chips have no monetary value and cannot be redeemed
- **Market phrasing** - markets are predictions, not bets
- **Election markets** - strict moderation and resolution rules

## 🎯 Next Steps

1. ✅ Review project plan and MVP breakdown
2. ⏳ Set up Phase 0 (project structure)
3. ⏳ Begin Phase 1 (authentication)
4. ⏳ Iterate based on feedback

---

**Ready to start?** Begin with Phase 0: Project Setup & Infrastructure!

