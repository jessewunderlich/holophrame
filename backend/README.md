# Holophrame Backend

Express.js API server for Holophrame social media platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Change `JWT_SECRET` to a secure random string
   - Adjust `CORS_ORIGIN` to match your frontend URL

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login

### Posts
- `GET /api/posts/public` - Get recent public posts (no auth required)
- `GET /api/posts/feed` - Get chronological feed (auth required)
- `GET /api/posts/:id` - Get single post with replies
- `POST /api/posts` - Create new post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required, owner only)

### Users
- `GET /api/users/:username` - Get user profile and posts
- `GET /api/users/search/:query` - Search users by username
- `PATCH /api/users/profile` - Update own profile (auth required)

### Messages
- Placeholder endpoints (to be implemented)

## Architecture

- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Database Models

### User
- username (unique, 3-20 chars, alphanumeric + underscore)
- email (unique, validated)
- password (hashed with bcrypt)
- bio (optional, max 200 chars)
- timestamps

### Post
- author (ref to User)
- content (1-500 chars)
- parentPost (ref to Post for replies)
- replies (array of Post refs)
- timestamps

## Authentication

JWT tokens are stored client-side and sent in `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens expire after 7 days (configurable in `.env`).

## Development Notes

- No external UI frameworks - frontend uses vanilla JS
- Chronological feed (no algorithms)
- Minimal data collection
- Simple, transparent API design
- RESTful endpoints
