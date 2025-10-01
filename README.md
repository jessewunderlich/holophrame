# HOLOPHRAME

**Minimal. Authentic. Chronological.**

A brutalist social media platform inspired by 1990s web aesthetics with modern functionality. No algorithms, no tracking, just pure chronological content.

![Holophrame](https://img.shields.io/badge/style-brutalist-black?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square) ![Tests](https://img.shields.io/badge/tests-17%2F17%20passing-success?style=flat-square)

## 🎯 Philosophy

- **Function over form**: Working features with minimal styling
- **No algorithms**: Chronological feeds only, no recommendation engines
- **Minimal data collection**: Username, email, password, bio only
- **Progressive enhancement**: HTML-first, then minimal CSS, then minimal JavaScript
- **Authenticity**: What you see is what you get - no hidden features

## ✨ Features

### Core Functionality
- 🔐 **User Authentication** - JWT-based auth with bcrypt password hashing
- 📝 **Posts** - 500 character limit, chronological feed
- ✏️ **Post Editing** - 5-minute edit window after posting
- 💬 **Reply Threading** - Nested replies with inline forms
- 💌 **Direct Messaging** - Real-time DMs with 1000 character limit
- 🔍 **User Search** - Find users by username
- 👤 **User Profiles** - Bio, post history
- 🌓 **Dark Mode** - Toggle between light/dark themes
- ⚡ **Real-time Updates** - WebSocket for instant post/message delivery

### Design
- Brutalist aesthetic with Times New Roman typography
- Classic hyperlink colors (blue/purple)
- No animations or smooth transitions
- 2px solid borders, no shadows or rounded corners
- Responsive mobile-first design

## 🛠 Tech Stack

### Frontend
- **HTML/CSS/JavaScript** - No frameworks, vanilla only
- **CSS Variables** - Theme system (light/dark mode)
- **WebSocket Client** - Real-time updates with auto-reconnect

### Backend
- **Node.js + Express.js** - RESTful API
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication (7-day expiry)
- **WebSocket (ws)** - Real-time communication
- **Winston** - Structured logging
- **Helmet** - HTTP security headers
- **express-rate-limit** - API protection
- **express-validator** - Input validation
- **Jest + Supertest** - Testing (17/17 tests passing, 93% coverage)

## 📁 Project Structure

```
holophrame/
├── frontend/           # Static files
│   ├── *.html         # Individual pages (no SPA)
│   ├── css/
│   │   └── style.css  # Single brutalist design system
│   └── js/            # Vanilla JS modules
│       ├── main.js    # API utilities, auth helpers
│       ├── auth.js    # Login/register logic
│       ├── feed.js    # Feed display and post creation
│       ├── messages.js # Direct messaging
│       └── websocket.js # WebSocket client
├── backend/
│   ├── server.js      # Express app entry point
│   ├── config/        # Configuration (logger, rate-limit, env validation)
│   ├── models/        # Mongoose schemas (User, Post, Message)
│   ├── routes/        # RESTful API endpoints
│   ├── middleware/    # JWT auth, request logging
│   └── __tests__/     # Jest test suites
├── start-dev.ps1      # Development startup script (Windows)
└── stop-dev.ps1       # Stop development servers (Windows)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested on v22.19.0)
- **MongoDB** (local or Atlas)
- **Python** 3.x (for frontend dev server, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/holophrame.git
   cd holophrame
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set your values
   ```

   Required variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/holophrame
   JWT_SECRET=your-64-character-random-string
   CORS_ORIGIN=http://localhost:8080
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Windows Service
   net start MongoDB
   
   # Or run directly
   mongod
   ```

5. **Run development servers**
   ```powershell
   # Windows (PowerShell)
   .\start-dev.ps1
   
   # Or manually:
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   python -m http.server 8080
   ```

6. **Open in browser**
   - Frontend: http://localhost:8080
   - Backend: http://localhost:3000
   - API: http://localhost:3000/api

## 🧪 Testing

```bash
cd backend
npm test              # Run all tests
npm run test:watch   # Watch mode
```

Current coverage: **17/17 tests passing, 93% coverage**

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts/feed` - Get chronological feed (authenticated)
- `GET /api/posts/public` - Get public posts (5 most recent)
- `GET /api/posts/:id` - Get single post with replies
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Edit post (5-minute window)
- `DELETE /api/posts/:id` - Delete post

### Messages
- `GET /api/messages/conversations` - List all conversations
- `GET /api/messages/conversation/:userId` - Get conversation with user
- `POST /api/messages/send` - Send direct message
- `GET /api/messages/unread-count` - Count unread messages
- `PUT /api/messages/mark-read/:userId` - Mark conversation as read

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/search/:query` - Search users by username
- `PATCH /api/users/profile` - Update own profile

## 🔒 Security Features

- **JWT Authentication** - 7-day token expiry
- **Bcrypt Password Hashing** - 10 rounds
- **Rate Limiting**:
  - Auth endpoints: 5 requests per 15 minutes
  - Post creation: 10 posts per minute
  - General API: 100 requests per 15 minutes
- **Input Validation** - express-validator on all inputs
- **XSS Protection** - HTML escaping on frontend
- **HTTP Security Headers** - Helmet middleware
- **CORS** - Configured origin restrictions

## 🎨 Design Principles

### Color Variables
```css
/* Light Mode */
--bg-primary: #FFFFFF
--text-primary: #000000
--link-color: #0000EE
--link-visited: #551A8B

/* Dark Mode */
--bg-primary: #000000
--text-primary: #FFFFFF
--link-color: #5555FF
--link-visited: #AA55DD
```

### Typography
- **Font Family**: Times New Roman (serif fallback)
- **No custom fonts** - System fonts only

### Layout
- Desktop-first responsive design
- Minimal media queries
- No CSS animations or transitions
- 2px solid borders on all elements

## 🔄 WebSocket Events

### Client → Server
- `auth` - Authenticate WebSocket connection
- `ping` - Heartbeat check

### Server → Client
- `new_post` - New post created
- `post_edited` - Post was edited
- `post_deleted` - Post was deleted
- `new_message` - Direct message received
- `notification` - General notification

## 📊 Development Workflow

### Code Style
- No frameworks (React, Vue, etc.)
- No build tools (Webpack, Vite, etc.)
- HTML/CSS/JS served directly
- ES6+ JavaScript (no transpilation)
- Winston logging (no console.log in production)

### Adding Features
1. Create backend route in `backend/routes/`
2. Add validation with express-validator
3. Implement frontend logic in `frontend/js/`
4. Update HTML with semantic markup
5. Add brutalist CSS styling
6. Write tests in `backend/__tests__/`
7. Update this README

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

**Recommended Stack:**
- Frontend: Vercel (free tier)
- Backend: Railway (free tier)
- Database: MongoDB Atlas (free tier)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. Maintain brutalist design aesthetic
2. No external dependencies unless absolutely necessary
3. Keep code simple and readable
4. Write tests for new features
5. Update documentation

## 🐛 Known Issues

- Edit window is strictly 5 minutes (no extension after first edit)
- WebSocket reconnect has exponential backoff (max 30 seconds)
- Message polling backup runs every 5 seconds (may need optimization)

## 🔮 Future Features

- [ ] User blocking/muting
- [ ] Post bookmarks
- [ ] Notification system UI
- [ ] Image uploads (minimal)
- [ ] User following system
- [ ] Post search
- [ ] Account deletion

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Follow project guidelines

---

**Built with ❤️ and brutalism in 2025**

*"What you see is what you get"*
