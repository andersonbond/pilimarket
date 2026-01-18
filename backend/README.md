# Pilimarket Backend

FastAPI backend for Pilimarket prediction market platform.

## Setup

1. Create virtual environment:
```bash
python/python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file (see SETUP.md for details)

4. Run database migrations (after models are created):
```bash
alembic upgrade head
```

5. Start development server:

**For macOS:**
```bash
# Option 1: Using venv Python directly (recommended for macOS)
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Option 2: Activate venv first, then run
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**For Linux/Windows:**
```bash
# Activate virtual environment first
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run with auto-reload (Linux/Windows)
uvicorn app.main:app --reload

# Or without reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Note:** The `--reload` flag may not work properly on macOS. Use the commands above without `--reload` for macOS.

## API Documentation

Once the server is running:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/v1/      # API endpoints
│   ├── models/      # SQLAlchemy models
│   ├── schemas/     # Pydantic schemas
│   ├── services/    # Business logic
│   ├── utils/       # Utilities
│   ├── tasks/       # Celery tasks
│   ├── config.py    # Configuration
│   ├── database.py  # Database setup
│   └── main.py      # FastAPI app
├── alembic/         # Database migrations
└── tests/           # Tests
```

## Development

### Code Formatting
```bash
black .
ruff check . --fix
```

### Running Tests
```bash
pytest
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Variables

See `.env.example` (create `.env` file with your values)

