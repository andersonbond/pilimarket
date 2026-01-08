"""
Custom middleware
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from typing import Optional

from app.utils.cache import redis_client


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with per-endpoint limits"""
    
    # Rate limits per endpoint (requests per minute)
    RATE_LIMITS = {
        "/api/v1/auth/register": 5,
        "/api/v1/auth/login": 10,
        "/api/v1/auth/forgot-password": 3,
        "/api/v1/auth/reset-password": 5,
        "/api/v1/auth/refresh": 20,
        "default": 60,  # Default rate limit
    }
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/", "/api/docs", "/api/redoc", "/openapi.json"]:
            response = await call_next(request)
            return response
        
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        
        # Determine rate limit for this endpoint
        rate_limit = self.RATE_LIMITS.get("default")
        for endpoint, limit in self.RATE_LIMITS.items():
            if endpoint != "default" and path.startswith(endpoint):
                rate_limit = limit
                break
        
        rate_limit_key = f"ratelimit:ip:{client_ip}:{path}"
        
        try:
            # Check rate limit
            current = redis_client.get(rate_limit_key)
            if current and int(current) >= rate_limit:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "success": False,
                        "data": None,
                        "errors": [{"message": "Rate limit exceeded. Please try again later."}],
                    },
                )
            
            # Increment counter
            redis_client.incr(rate_limit_key)
            redis_client.expire(rate_limit_key, 60)
        except Exception:
            # If Redis is unavailable, allow request through (fail open)
            # In production, you might want to fail closed
            pass
        
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip security headers for OPTIONS requests (CORS preflight)
        # These should be handled by CORS middleware only
        if request.method == "OPTIONS":
            response = await call_next(request)
            return response
        
        response = await call_next(request)
        
        # Skip security headers for API endpoints (they're for HTML pages)
        # Only apply to non-API paths (like static files or HTML pages)
        path = request.url.path
        
        # Don't apply security headers to API responses - they can interfere with CORS
        # Security headers are meant for HTML pages, not JSON API responses
        if path.startswith("/api/") or path.startswith("/uploads/"):
            return response
        
        # Apply security headers only to non-API responses (HTML pages, static files)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy - only for HTML pages
        # Allow connections to localhost for development and same origin + https for production
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # unsafe-inline/eval for Ionic
            "style-src 'self' 'unsafe-inline'; "  # unsafe-inline for TailwindCSS
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:* https: ws: wss:; "  # Allow localhost for dev, https for prod
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # Strict Transport Security (only in production with HTTPS)
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

