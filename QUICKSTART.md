# Holophrame - Quick Start Guide

Get Holophrame running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running locally
- Git (optional)

## Setup Steps

### 1. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 2. Configure Environment

The `.env` file has already been created with development defaults:
- MongoDB: `mongodb://localhost:27017/holophrame`
- Port: 3000
- JWT Secret: Development key (change for production!)
- CORS: Allows `http://localhost:8080`

**No changes needed for local development!**

### 3. Start MongoDB

If MongoDB isn't running:

```powershell
# Windows - if installed as service
net start MongoDB

# Or run manually
mongod
```

### 4. Start Backend Server

```powershell
# From backend directory
npm run dev
```

You should see:
```
MongoDB connected successfully
Holophrame server running on port 3000
WebSocket server ready
```

### 5. Start Frontend

Open a new terminal:

```powershell
# From project root
cd frontend

# Option 1: Python
python -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: PHP
php -S localhost:8080
```

### 6. Open in Browser

Navigate to: http://localhost:8080

## First Steps

1. **Register an account** - Click "Register" in navigation
2. **Create a post** - Go to Feed, type in the textarea, click "Post"
3. **View profile** - Click "Profile" to see your posts
4. **Search users** - Click "Search" to find other users
5. **Watch real-time updates** - Open in two browser tabs, post in one, see update in other

## Testing the Setup

### Test Backend API

```powershell
# From backend directory
npm test
```

You should see all tests passing:
- User Model Tests ✓
- Post Model Tests ✓
- Auth Routes Tests ✓

### Test WebSocket Connection

1. Open browser DevTools (F12)
2. Go to Network tab → WS filter
3. Login to Holophrame
4. You should see WebSocket connection established
5. Create a post → WebSocket broadcasts the update

## Common Issues

### MongoDB Connection Error

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Fix**: 
- Ensure MongoDB is running: `mongod`
- Check port 27017 is not in use
- Verify `MONGODB_URI` in `.env`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Fix**:
- Change `PORT=3001` in `.env`
- Or kill process using port 3000:
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### Frontend Can't Connect to Backend

**Error**: CORS errors in browser console

**Fix**:
- Verify backend is running on port 3000
- Check `API_BASE_URL` in `frontend/js/main.js`
- Ensure `CORS_ORIGIN` in `.env` matches frontend URL

### WebSocket Connection Failed

**Error**: WebSocket connection closes immediately

**Fix**:
- Check browser console for auth errors
- Verify JWT token is valid (logout/login)
- Check backend logs for WebSocket errors

## Development Tips

### Hot Reload

Backend uses `nodemon` for auto-reload on file changes.

Frontend requires manual browser refresh (no build step).

### Debugging

**Backend**:
```javascript
console.log('Debug:', variableName);
```
Output appears in terminal running `npm run dev`

**Frontend**:
```javascript
console.log('Debug:', variableName);
```
Output appears in browser DevTools console

### Database Inspection

**MongoDB Compass**: GUI tool for viewing database
- Connect to: `mongodb://localhost:27017`
- Database: `holophrame`
- Collections: `users`, `posts`

**Command Line**:
```powershell
mongosh
use holophrame
db.users.find()
db.posts.find()
```

## Next Steps

- Read `DEPLOYMENT.md` for production deployment
- Check `.github/copilot-instructions.md` for coding guidelines
- Run tests: `npm test` in backend directory
- Explore API with Postman/Insomnia

## Project Structure Quick Reference

```
holophrame/
├── frontend/
│   ├── index.html          Landing page
│   ├── feed.html           Main feed (chronological)
│   ├── profile.html        User profiles
│   ├── search.html         User search
│   ├── css/style.css       Brutalist design system
│   └── js/
│       ├── main.js         Core utilities, API wrapper
│       ├── auth.js         Login/register
│       ├── feed.js         Post creation/display
│       ├── profile.js      Profile viewing/editing
│       ├── search.js       User search
│       └── websocket.js    Real-time updates
├── backend/
│   ├── server.js           Express app + WebSocket
│   ├── websocket.js        WebSocket server class
│   ├── models/
│   │   ├── User.js         User schema
│   │   └── Post.js         Post schema
│   ├── routes/
│   │   ├── auth.js         Register, login
│   │   ├── posts.js        CRUD operations
│   │   ├── users.js        Profiles, search
│   │   └── messages.js     Placeholder
│   ├── middleware/
│   │   └── auth.js         JWT verification
│   └── __tests__/          Jest test suites
└── .github/
    └── copilot-instructions.md  AI agent guide
```

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review `.github/copilot-instructions.md`
3. Check backend logs for errors
4. Use browser DevTools to inspect network requests

---

**Happy coding! Remember: function over form, chronological over algorithmic, authenticity over manipulation.**
