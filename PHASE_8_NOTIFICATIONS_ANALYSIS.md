# Phase 8: Activity Feed & Notifications - Efficiency & Optimization Analysis

## Executive Summary

This document analyzes Phase 8 requirements and provides recommendations for efficiently implementing and optimizing the in-app notification system for Pilimarket.com.

## Current Requirements (From Checklist)

### Backend
- Activities table migration
- Notifications table migration
- Activity and Notification models
- Activity feed endpoint (user's feed)
- Global activity endpoint
- Notifications endpoint with pagination
- Mark as read endpoint
- Background jobs (deferred for MVP)

### Frontend
- Activity feed page
- Activity cards
- Notification bell/icon in header
- Notification dropdown
- Notification list page
- Homepage activity widget
- Unread count badge

---

## 1. Database Design Optimization

### 1.1 Activities Table

**Recommended Schema:**
```sql
CREATE TABLE activities (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR NOT NULL,
  market_id VARCHAR REFERENCES markets(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Composite indexes for common queries
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_activities_global_created ON activities(created_at DESC) WHERE user_id IS NULL;
CREATE INDEX idx_activities_market_created ON activities(market_id, created_at DESC) WHERE market_id IS NOT NULL;
CREATE INDEX idx_activities_type_created ON activities(activity_type, created_at DESC);
```

**Optimization Strategies:**
1. **Partitioning (Future)**: Consider partitioning by `created_at` for very large datasets (monthly partitions)
2. **Partial Indexes**: Use `WHERE user_id IS NOT NULL` for user-specific queries
3. **JSONB Metadata**: Store flexible data (forecast points, badge names, etc.) without schema changes
4. **Soft Deletes**: Use `user_id IS NULL` instead of deleting rows (preserves global feed)

### 1.2 Notifications Table

**Recommended Schema:**
```sql
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Critical indexes for performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC) WHERE read = false;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

**Optimization Strategies:**
1. **Unread-First Index**: Composite index with `read = false` for fast unread queries
2. **Automatic Cleanup**: Archive/delete read notifications older than 90 days (background job)
3. **Bulk Operations**: Support batch mark-as-read operations
4. **Notification Aggregation**: Group similar notifications (e.g., "3 markets resolved" instead of 3 separate)

### 1.3 Data Retention Strategy

**Recommendations:**
- **Activities**: Keep indefinitely (for global feed and analytics)
- **Notifications**: 
  - Keep unread: Indefinitely
  - Keep read: 90 days (then archive or delete)
  - Archive old notifications to separate table or S3 for analytics

---

## 2. API Design Optimization

### 2.1 Notification Endpoints

**Recommended Endpoints:**

```python
# Get notifications with smart defaults
GET /api/v1/notifications
  Query params:
    - unread_only: bool (default: false)
    - page: int (default: 1)
    - limit: int (default: 20, max: 100)
    - type: str (optional filter)
  
  Response:
    {
      "success": true,
      "data": {
        "notifications": [...],
        "unread_count": 5,  # Always included for badge
        "pagination": {...}
      }
    }

# Mark single notification as read
POST /api/v1/notifications/{id}/read

# Mark all as read (bulk operation)
POST /api/v1/notifications/read-all

# Get unread count only (lightweight)
GET /api/v1/notifications/unread-count
  Response: {"unread_count": 5}  # Fast, cached response
```

**Optimization Strategies:**
1. **Separate Unread Count Endpoint**: Lightweight endpoint for header badge (can be cached)
2. **Bulk Operations**: Support marking multiple/all as read in one request
3. **Pagination**: Use cursor-based pagination for better performance than offset-based
4. **Field Selection**: Allow clients to request only needed fields

### 2.2 Activity Feed Endpoints

**Recommended Endpoints:**

```python
# User's personalized feed
GET /api/v1/activity/feed
  Query params:
    - page: int (default: 1)
    - limit: int (default: 20)
    - type: str (optional filter)
    - market_id: str (optional filter)
  
# Global activity feed (public)
GET /api/v1/activity/global
  Query params:
    - page: int (default: 1)
    - limit: int (default: 50)
    - type: str (optional filter)
    - category: str (optional filter)
```

**Optimization Strategies:**
1. **Caching**: Cache global feed for 1-2 minutes (Redis)
2. **Aggregation**: Group similar activities (e.g., "5 users forecasted on Market X")
3. **Infinite Scroll**: Use cursor-based pagination for better UX

---

## 3. Real-Time vs Polling Strategy

### 3.1 Current Approach (Polling)

**For MVP, recommend polling with smart intervals:**

```typescript
// Frontend polling strategy
- Unread count: Poll every 30 seconds (lightweight)
- Notification dropdown: Poll every 10 seconds when open
- Activity feed: Poll every 60 seconds (or on user interaction)
- Background: Pause polling when tab is inactive (Page Visibility API)
```

**Advantages:**
- Simple to implement
- No WebSocket infrastructure needed
- Works with existing API
- Easy to debug

**Disadvantages:**
- Higher server load
- Slight delay in updates
- Battery drain on mobile

### 3.2 Future: WebSocket/Server-Sent Events (SSE)

**For production scale, consider:**
- **WebSocket**: Full bidirectional communication
- **Server-Sent Events (SSE)**: Simpler, one-way (server → client)
- **Hybrid**: Polling for MVP, upgrade to SSE/WebSocket later

**SSE Implementation (Recommended for Phase 8.5):**
```python
# Backend: FastAPI SSE endpoint
GET /api/v1/notifications/stream
  - Returns SSE stream
  - Sends new notifications in real-time
  - Reconnects automatically
```

---

## 4. Caching Strategy

### 4.1 Redis Caching

**Cache Keys:**
```
# Unread count (30 second TTL)
notifications:unread_count:{user_id} → integer

# Recent notifications (1 minute TTL)
notifications:recent:{user_id} → JSON array

# Global activity feed (2 minute TTL)
activity:global:recent → JSON array

# User activity feed (1 minute TTL)
activity:feed:{user_id} → JSON array
```

**Cache Invalidation:**
- On new notification: Invalidate `notifications:*:{user_id}`
- On mark as read: Invalidate unread count and recent notifications
- On new activity: Invalidate global feed cache

### 4.2 Frontend Caching

**LocalStorage/SessionStorage:**
- Cache unread count (with timestamp)
- Cache recent notifications (last 10, with timestamp)
- Use stale-while-revalidate pattern

---

## 5. Notification Generation Strategy

### 5.1 Event-Driven Architecture

**Trigger Points:**
1. **Market Resolved**: Notify all users who forecasted on that market
2. **Badge Earned**: Notify user immediately
3. **New Market**: Notify users following that category (future feature)
4. **Forecast Reminder**: Notify users with pending forecasts (future feature)

### 5.2 Batch Notification Creation

**Optimization:**
```python
# Instead of creating one notification per user
# Create notifications in batch

def create_market_resolved_notifications(db, market_id, winning_outcome):
    # Get all users who forecasted
    user_ids = db.query(Forecast.user_id).filter(
        Forecast.market_id == market_id
    ).distinct().all()
    
    # Batch insert (single query)
    notifications = [
        Notification(
            user_id=user_id,
            type="market_resolved",
            message=f"Market '{market.title}' resolved",
            metadata={"market_id": market_id, "outcome": winning_outcome}
        )
        for user_id in user_ids
    ]
    db.bulk_insert_mappings(Notification, notifications)
    db.commit()
```

**Benefits:**
- Single database transaction
- Much faster than individual inserts
- Atomic operation

### 5.3 Notification Deduplication

**Strategy:**
- Check if similar notification exists within last hour
- Aggregate: "3 markets resolved" instead of 3 separate notifications
- Use `metadata` JSONB to store aggregation data

---

## 6. Frontend Optimization

### 6.1 Notification Bell Component

**Optimization Strategies:**
1. **Lazy Loading**: Only fetch notifications when dropdown opens
2. **Virtual Scrolling**: For long notification lists
3. **Optimistic Updates**: Mark as read immediately, sync with backend
4. **Debouncing**: Debounce mark-as-read requests

**Implementation:**
```typescript
// Smart polling with visibility detection
useEffect(() => {
  if (!document.hidden) {
    const interval = setInterval(() => {
      fetchUnreadCount(); // Lightweight call
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }
}, [document.hidden]);
```

### 6.2 Activity Feed Optimization

**Strategies:**
1. **Infinite Scroll**: Load more on scroll (not pagination buttons)
2. **Image Lazy Loading**: Lazy load market images
3. **Skeleton Loading**: Show skeleton while loading
4. **Client-Side Filtering**: Filter by type on client (after initial load)

### 6.3 State Management

**Recommendations:**
- Use React Context for notification state
- Cache notifications in memory
- Sync with localStorage for persistence
- Optimistic updates for better UX

---

## 7. Performance Considerations

### 7.1 Database Query Optimization

**Critical Queries:**
```sql
-- Unread count (must be fast)
SELECT COUNT(*) FROM notifications 
WHERE user_id = ? AND read = false;

-- Recent notifications (paginated)
SELECT * FROM notifications 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- Mark all as read (bulk update)
UPDATE notifications 
SET read = true 
WHERE user_id = ? AND read = false;
```

**Optimizations:**
1. **Covering Index**: Include all needed columns in index
2. **Partial Index**: Index only unread notifications
3. **Bulk Updates**: Use single UPDATE for mark-all-read

### 7.2 API Response Optimization

**Strategies:**
1. **Field Selection**: Allow `?fields=id,message,created_at` to reduce payload
2. **Compression**: Enable gzip/brotli compression
3. **Pagination**: Limit to 50 items per page
4. **Minimal Metadata**: Only include essential data in initial response

### 7.3 Background Job Strategy

**For MVP (Synchronous):**
- Create notifications immediately when events occur
- No background job needed initially

**For Scale (Asynchronous):**
- Use Celery for notification creation
- Queue notification jobs
- Process in batches
- Retry failed notifications

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling

**Challenges:**
- Real-time notifications require sticky sessions (if using WebSocket)
- Cache invalidation across multiple servers
- Database connection pooling

**Solutions:**
- Use Redis pub/sub for cache invalidation
- Use load balancer with session affinity (if WebSocket)
- Connection pooling (SQLAlchemy pool)

### 8.2 Database Scaling

**Strategies:**
1. **Read Replicas**: Use read replicas for activity feed queries
2. **Partitioning**: Partition notifications table by user_id hash (future)
3. **Archiving**: Move old notifications to archive table

### 8.3 Notification Volume

**Expected Volume (Estimates):**
- 1,000 active users
- 10 markets resolved/day = 100 notifications (10 forecasts/market avg)
- 50 badges earned/day = 50 notifications
- **Total: ~150 notifications/day = manageable**

**For 10,000+ users:**
- Consider notification aggregation
- Batch similar notifications
- Use background jobs
- Implement rate limiting

---

## 9. Recommended Implementation Approach

### Phase 8.1: Core Notification System (MVP)

**Priority 1: Essential Features**
1. ✅ Database schema (activities + notifications tables)
2. ✅ Notification model and API endpoints
3. ✅ Notification bell with unread count
4. ✅ Notification dropdown/list
5. ✅ Mark as read functionality
6. ✅ Polling for unread count (30s interval)

**Priority 2: Activity Feed**
1. ✅ Activity model and API endpoints
2. ✅ Activity feed page
3. ✅ Global activity widget (homepage)
4. ✅ Basic activity cards

### Phase 8.2: Optimization (Post-MVP)

**Enhancements:**
1. Redis caching for unread count
2. Notification aggregation
3. Bulk mark-as-read
4. Activity feed caching
5. Optimistic UI updates

### Phase 8.3: Real-Time (Future)

**Advanced Features:**
1. Server-Sent Events (SSE) for real-time notifications
2. WebSocket support (if needed)
3. Push notifications (mobile)
4. Email notifications

---

## 10. Key Optimization Recommendations

### ✅ **DO:**
1. **Use composite indexes** on (user_id, read, created_at) for notifications
2. **Cache unread count** in Redis (30s TTL)
3. **Batch insert** notifications when possible
4. **Use polling** with smart intervals (30s for count, pause when inactive)
5. **Implement pagination** with reasonable limits (20-50 items)
6. **Archive old notifications** (90+ days) to reduce table size
7. **Use JSONB metadata** for flexible notification data
8. **Optimistic updates** in frontend for better UX

### ❌ **DON'T:**
1. **Don't poll too frequently** (< 10 seconds is wasteful)
2. **Don't load all notifications** at once (use pagination)
3. **Don't create duplicate notifications** (check before creating)
4. **Don't store large payloads** in notification message (use metadata)
5. **Don't query without indexes** (ensure all queries use indexes)
6. **Don't forget to clean up** old read notifications

---

## 11. Performance Targets

**Response Time Goals:**
- Unread count: < 50ms (cached)
- Notification list (20 items): < 200ms
- Mark as read: < 100ms
- Activity feed (20 items): < 300ms

**Scalability Goals:**
- Support 1,000 concurrent users
- Handle 1,000 notifications/day
- Database queries < 100ms (p95)

---

## 12. Monitoring & Metrics

**Key Metrics to Track:**
1. Notification creation rate
2. Unread count query performance
3. Mark-as-read operation time
4. Cache hit rate
5. Polling frequency per user
6. Database query performance

**Alerts:**
- Unread count query > 200ms
- Notification creation queue backlog
- Cache miss rate > 20%

---

## Conclusion

For MVP, implement a **polling-based notification system** with:
- Efficient database indexes
- Redis caching for unread count
- Batch notification creation
- Smart polling intervals
- Pagination and lazy loading

This approach is:
- ✅ Simple to implement
- ✅ Performant for MVP scale
- ✅ Easy to upgrade to real-time later
- ✅ Cost-effective (no WebSocket infrastructure)

**Estimated Implementation Time:** 2-3 days for core features, 1 day for optimization.

