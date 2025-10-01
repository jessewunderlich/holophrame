# Holophrame - AI Agent Instructions

Holophrame is a minimal social media platform inspired by 1990s web aesthetics with modern functionality. This codebase embraces **brutalist design principles**: raw HTML, Times New Roman typography, classic hyperlink colors, and transparent functionality over flashy aesthetics.

## Core Philosophy

- **Function over form**: Prioritize working features with minimal styling
- **No algorithms**: Chronological feeds only, no recommendation engines
- **Minimal data collection**: Username, email, password, bio only
- **Progressive enhancement**: HTML-first, then minimal CSS, then minimal JavaScript
- **Authenticity**: What you see is what you get - no hidden features

## Architecture Overview

### Tech Stack
- **Frontend**: Vanilla HTML/CSS/JavaScript (NO frameworks like React/Vue/Bootstrap)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT tokens (7-day expiry) with bcrypt password hashing
- **Real-time**: WebSocket (ws library) for live feed updates
- **Security**: Helmet for HTTP security headers, express-rate-limit for API protection
- **Logging**: Winston for structured logging (replaces console.log)
- **Validation**: express-validator for input validation, Joi for environment validation
- **Testing**: Jest with Supertest for API testing
- **Deployment**: Vercel (frontend) + Railway (backend)

### Project Structure
```
holophrame/
├── frontend/           # Static files served via simple HTTP server
│   ├── *.html         # Individual pages (no SPA)
│   ├── css/style.css  # Single brutalist design system
│   └── js/            # Vanilla JS modules
│       ├── main.js    # API utilities, auth helpers, formatters
│       ├── auth.js    # Login/register logic
│       ├── feed.js    # Feed display and post creation
│       └── websocket.js # WebSocket client with auto-reconnect
├── backend/
│   ├── server.js      # Express app entry point
│   ├── config/        # Configuration files
│   │   ├── logger.js  # Winston logger configuration
│   │   ├── validate-env.js # Joi environment validation
│   │   └── rate-limit.js # Rate limiting configurations
│   ├── models/        # Mongoose schemas
│   ├── routes/        # RESTful API endpoints
│   ├── middleware/    # JWT auth, request logging
│   └── __tests__/     # Jest test suites
```

## Key Conventions & Patterns

### Design System Rules
- **Colors**: Use CSS variables for theming
  - Light mode: White background `#FFFFFF`, black text `#000000`
  - Dark mode: Black background `#000000`, white text `#FFFFFF`
  - Links: Blue `#0000EE` (light) / `#5555FF` (dark), visited `#551A8B` / `#AA55DD`
  - Always use `var(--bg-primary)`, `var(--text-primary)`, etc. instead of hardcoded colors
- **Typography**: Times New Roman only - system serif fallback
- **Links**: Yellow background `#FFFF00` on hover (same in both modes)
- **Forms**: 2px solid borders, use `var(--bg-secondary)` for form backgrounds
- **Buttons**: Use theme variables, invert on hover
- **Posts/Cards**: 2px solid borders, no shadows or rounded corners
- **No animations**: No transitions, smooth scrolling, or fades
- **Mobile-responsive**: Desktop-first approach with minimal `@media` queries

### Frontend Patterns

1. **Page Structure** - Every HTML page follows this template:
   ```html
   <body>
   <button id="theme-toggle" class="theme-toggle" onclick="toggleTheme()">DARK MODE</button>
   <header><h1>HOLOPHRAME</h1></header>
   <nav>Home | Login | Register | About</nav>
   <hr>
   <main><section><!-- content --></section></main>
   <hr>
   <footer><!-- links --></footer>
   <script src="js/theme.js"></script>
   <script src="js/main.js"></script>
   </body>
   ```

2. **API Communication** - Use `apiRequest()` helper from `main.js`:
   ```javascript
   const data = await apiRequest('/posts/feed', {
       method: 'POST',
       body: JSON.stringify({ content })
   });
   ```

3. **Authentication Flow**:
   - JWT stored in `localStorage` as `holophrameToken`
   - User object stored as `holophrameUser` (JSON string)
   - Auth header: `Authorization: Bearer <token>`
   - Protected pages check `isAuthenticated()` on load

4. **XSS Prevention** - Always use `escapeHtml()` when rendering user content:
   ```javascript
   postContent.innerHTML = escapeHtml(post.content);
   ```

5. **Dark Mode** - Theme automatically applied based on system preference or user selection:
   - Theme persisted in `localStorage` as `holophrameTheme`
   - Use CSS variables for all colors: `var(--bg-primary)`, `var(--text-primary)`, etc.
   - Toggle button in top-right corner on all pages
   - Never hardcode colors - always use CSS variables

### Backend Patterns

1. **Route Organization** - RESTful endpoints grouped by resource:
   - `routes/auth.js` - Register, login (with strict rate limiting)
   - `routes/posts.js` - CRUD operations (with post rate limiting)
   - `routes/users.js` - Profile viewing, searching
   - `routes/messages.js` - Placeholder for future DM system

2. **Authentication Middleware** - Apply `auth` to protected routes:
   ```javascript
   router.post('/posts', auth, async (req, res) => {
       // req.user populated by middleware
   });
   ```

3. **Logging Pattern** - Use winston logger instead of console.log:
   ```javascript
   const logger = require('../config/logger');
   
   logger.info('User registered successfully');
   logger.error(`Error: ${error.message}`);
   logger.warn('Deprecated endpoint accessed');
   logger.debug('Debug information');
   ```

4. **Rate Limiting Pattern** - Apply appropriate limiters:
   ```javascript
   const { authLimiter, postLimiter } = require('../config/rate-limit');
   
   router.post('/register', authLimiter, ...); // 5 attempts per 15 min
   router.post('/posts', auth, postLimiter, ...); // 10 posts per minute
   // apiLimiter applied globally to all /api/* routes
   ```

5. **Environment Validation** - Joi schema validates on startup:
   ```javascript
   // In server.js
   const validateEnv = require('./config/validate-env');
   const env = validateEnv(); // Validates or exits with error
   ```

6. **Security Headers** - Helmet middleware applied globally:
   ```javascript
   app.use(helmet({
       contentSecurityPolicy: false,
       crossOriginEmbedderPolicy: false,
   }));
   ```

7. **Validation Pattern** - Use `express-validator` chains:
   ```javascript
   router.post('/register', [
       body('username').trim().isLength({ min: 3, max: 20 }),
       body('email').isEmail().normalizeEmail()
   ], async (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
           return res.status(400).json({ error: errors.array()[0].msg });
       }
   });
   ```

8. **Error Responses** - Always return JSON with `error` key:
   ```javascript
   res.status(400).json({ error: 'Descriptive message' });
   ```

9. **Chronological Queries** - Posts always sorted newest first:
   ```javascript
   Post.find({ parentPost: null }).sort({ createdAt: -1 })
   ```

### Database Models

- **User**: `username` (unique, 3-20 chars, alphanumeric+underscore), `email`, `password` (hashed), `bio` (max 200 chars)
- **Post**: `author` (ref User), `content` (1-500 chars), `parentPost` (for threading), `replies` array
- Password comparison: `user.comparePassword(candidatePassword)` (async)
- Public user data: `user.toPublicJSON()` strips password/email

### WebSocket Implementation

- **Server**: `backend/websocket.js` - WebSocket server class with authentication
- **Client**: `frontend/js/websocket.js` - Auto-reconnecting WebSocket client
- **Features**: Real-time post broadcasts, deletion notifications, heartbeat/ping-pong
- **Authentication**: Clients must send JWT token after connection
- **Integration**: WebSocket server attached to HTTP server, accessed via `req.app.get('wsServer')`

**Broadcasting patterns**:
```javascript
// Broadcast new post
const wsServer = req.app.get('wsServer');
if (wsServer) {
    wsServer.broadcastNewPost(postData);
}

// Notify specific user
wsServer.notifyUser(userId, notificationData);
```

## Development Workflows

### Starting the Application

1. **Backend** (requires MongoDB running):
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Edit JWT_SECRET
   npm run dev           # Auto-reload with nodemon
   ```

2. **Frontend** (separate terminal):
   ```bash
   cd frontend
   python -m http.server 8080
   # Or: npx http-server -p 8080
   ```

3. Navigate to `http://localhost:8080`

### Adding New Features

1. **New Pages**: Create HTML file, link `style.css`, include `main.js`, add nav links to all pages
2. **New API Endpoints**: Add route handler, apply validation, require `auth` middleware if protected
3. **New Models**: Use Mongoose schema with indexes for query performance
4. **Frontend JS**: Add to existing modules or create new one (keep minimal)

## Critical Context

### What Makes This Different

- **No frameworks**: We intentionally avoid React, Vue, Bootstrap to maintain brutalist aesthetic
- **No build step**: HTML/CSS/JS are served directly - no webpack, Vite, etc.
- **Chronological feed**: The `sort({ createdAt: -1 })` pattern is non-negotiable - no algorithmic sorting
- **Character limits**: Posts capped at 500 chars (short-form like early Twitter)
- **Minimal UI**: Default HTML styling preferred - avoid adding unnecessary CSS

### Common Pitfalls

- Don't add CSS animations or transitions (violates brutalist principles)
- Don't use `div` soup - prefer semantic HTML (`<section>`, `<article>`, `<nav>`)
- Don't implement infinite scroll - use "Load More" button for pagination
- Don't add external CDN dependencies - keep everything local
- Don't use localStorage for sensitive data beyond JWT tokens

### Implemented Features

- ✅ User authentication (JWT)
- ✅ Post creation/deletion (500 char limit)
- ✅ Chronological feed with pagination
- ✅ User profiles with bio editing
- ✅ User search functionality
- ✅ WebSocket real-time updates
- ✅ Post threading/replies

### Future Features (Not Yet Implemented)

- Direct messaging system (UI exists as placeholder)
- Group/community creation
- Rich notification system UI
- Post editing
- User blocking/muting
- Image uploads (intentionally minimal)

## Testing & Debugging

### Running Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch   # Watch mode
```

- **Test setup**: `__tests__/setup.js` - In-memory MongoDB with mongodb-memory-server
- **Test files**: `__tests__/*.test.js` - Jest test suites
- **Coverage**: User model, Post model, Auth routes
- **Patterns**: Use `createTestUser()` helper, `supertest` for API testing

### Debugging

- **Backend logs**: Check terminal running `npm run dev` for Express logs
- **Frontend errors**: Open browser DevTools console
- **Database inspection**: Use MongoDB Compass or `mongosh` CLI
- **WebSocket**: Check browser Network tab → WS filter for WebSocket messages
- **Manual testing**: Postman/curl for API endpoints

## External Dependencies

- Express.js ecosystem: `express`, `cors`, `dotenv`
- Mongoose for MongoDB ODM
- Authentication: `jsonwebtoken`, `bcryptjs`
- Validation: `express-validator` (input), `joi` (environment)
- Security: `helmet` (HTTP headers), `express-rate-limit` (API protection)
- Logging: `winston` with colorized console and file transports
- WebSocket: `ws` library
- Testing: `jest`, `supertest`, `mongodb-memory-server`
- All dependencies listed in `backend/package.json` - keep minimal

## Deployment

See `DEPLOYMENT.md` for complete guide. Quick reference:

### Production Stack
- **Frontend**: Vercel (free tier)
- **Backend**: Railway (free tier)
- **Database**: MongoDB Atlas (free tier)

### Key Configuration Files
- `frontend/vercel.json` - Vercel config with security headers
- `backend/.env` - Environment variables (never commit)
- `.gitignore` - Exclude node_modules, .env, logs

### Environment Variables (Production)
```bash
# Backend (Railway)
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64-char-random-string>
CORS_ORIGIN=https://your-app.vercel.app

# Frontend (Vercel)
VITE_API_URL=https://your-app.up.railway.app/api
```

---

**When suggesting changes**: Maintain the brutalist aesthetic, avoid modern UI patterns (smooth scrolling, hover effects, etc.), keep code simple and readable, prioritize function over form.
