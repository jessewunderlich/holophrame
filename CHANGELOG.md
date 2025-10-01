# Holophrame Changelog

## [v0.2.0] - October 1, 2025 - Dark Mode & Threading Update

### ✨ New Features

#### Dark Mode
- Full dark mode implementation with brutalist aesthetics
- CSS variables system (`:root` and `.dark-mode` classes)
- Toggle button on all 8 pages (top-right corner, fixed position)
- localStorage persistence
- Automatic system preference detection
- Black/white color swap with yellow hover states
- Works seamlessly across all pages

#### Reply Threading
- Inline reply functionality
- Click "Reply" → form appears below post
- Replies display with indentation (30px) and left border (3px)
- Real-time reply display (no page refresh required)
- Replies persist and load automatically with parent posts
- Character counter (0/500)
- Toggle reply form on/off

### 🔧 Changes

#### Registration Flow
- Registration now redirects to login page (not auto-login)
- Backend doesn't return token on registration
- Users must explicitly login after registering
- Better UX and security pattern

#### MongoDB Configuration
- Switched to local MongoDB for development
- MongoDB Atlas had SSL/TLS compatibility issues with Node.js v22.19.0
- Local MongoDB runs as Windows service
- Atlas connection string preserved in `.env` comments for production

### 🐛 Bug Fixes

#### Authentication
- Fixed script loading order in login/register pages
- Resolved "apiRequest not defined" error
- Automatic cleanup of invalid auth tokens
- Invalid tokens now auto-redirect to login
- Registration explicitly clears existing auth data

#### Real-Time Features
- WebSocket now inserts posts directly into DOM
- Smooth fade-in animation for new posts (0.3s)
- Proper event handler attachment for dynamically added content
- No more "click to refresh" banners

#### Reply System
- Removed non-functional "View Thread" links
- Replies now display inline automatically
- Backend populates replies array with author data
- Delete buttons on replies work correctly

### 📝 Documentation
- Cleaned up 12+ temporary troubleshooting files
- Kept essential docs: `README.md`, `DEPLOYMENT.md`, `QUICKSTART.md`
- Updated `CURRENT_STATUS.md`
- This `CHANGELOG.md` for version tracking

---

## Technical Details

### Files Modified

**Backend (3 files)**:
- `routes/auth.js` - Registration endpoint (no token return)
- `routes/posts.js` - Feed endpoint (populate replies)
- `server.js` - Standard MongoDB connection

**Frontend (9 files)**:
- `css/style.css` - CSS variables, reply styling, animations
- `js/theme.js` - **NEW** - Dark mode toggle logic
- `js/auth.js` - Registration flow fixes
- `js/main.js` - Invalid token detection
- `js/feed.js` - Reply form and threading display
- `js/websocket.js` - Real-time post insertion
- `login.html`, `register.html` - Script loading order
- All 8 HTML pages - Theme toggle button

### API Changes
- **POST /api/auth/register** - Now returns `{message, username}` instead of `{token, user}`

### Database Schema
- No changes to models
- Existing `replies` array on Post model now properly populated in feed queries

---

## Testing Results

### ✅ Verified Working
- User registration → login flow
- User authentication (JWT)
- Post creation (500 char limit)
- Reply posting with immediate display
- Reply threading display (indentation + border)
- Reply persistence (survives page refresh)
- Real-time WebSocket post updates
- Dark mode toggle on all pages
- Dark mode persistence
- Post deletion
- User profiles
- User search

### 🧪 Not Yet Tested
- Direct messaging (placeholder only)
- Notifications (backend events exist, no UI)
- Mobile responsiveness
- Multiple reply levels (currently 1-level deep)

---

## Known Limitations
- Reply depth limited to 1 level (parent → reply, no nested)
- No dedicated thread view page (can add if needed)
- Direct messaging UI exists but not functional

---

## Development Environment

**Current Stack**:
- Node.js v22.19.0
- MongoDB 8.0+ (Local Windows Service)
- Express.js 4.x
- Mongoose 7.x
- WebSocket (ws library)
- Vanilla HTML/CSS/JavaScript (no frameworks)

**Ports**:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- MongoDB: mongodb://localhost:27017/holophrame

**Scripts**:
- `.\start-dev.ps1` - Start both servers
- `.\stop-dev.ps1` - Stop both servers

---

## Production Deployment Notes

### Before Deploying:
1. Switch to MongoDB Atlas connection string (in `.env`)
2. Generate secure JWT_SECRET (64+ random characters)
3. Update CORS_ORIGIN to production frontend URL
4. Verify Railway deployment doesn't have SSL/TLS issues with Atlas

### Deployment Targets:
- Frontend: Vercel (static files)
- Backend: Railway (Node.js)
- Database: MongoDB Atlas (free tier)

---

## What's Next?

### Potential Features:
- Post editing functionality
- User blocking/muting
- Minimal image upload support
- Groups/communities
- Rich notification UI
- Deeper reply threading (multiple levels)
- Dedicated thread view page
- Search improvements (full-text search)

### Performance Improvements:
- Feed pagination optimization
- WebSocket connection pooling
- Database indexing review
- Asset optimization (CSS/JS minification)

---

**Status**: All core features working and tested. Ready for additional features or production deployment.
