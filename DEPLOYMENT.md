# Deployment Guide

This guidIn Railway dashboard, go to Variables tab and add:

**Required Variables:**
```
NODE_ENV=production
MONGDB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/holophrame
JWT_SECRET=<generate-strong-random-string>
CORS_ORIGIN=https://your-app.vercel.app
```

**Optional Variables (with defaults):**
```
PORT=3000
JWT_EXPIRE=7d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

To generate JWT_SECRET (must be 32+ characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```ying Holophrame to production using Vercel (frontend) and Railway (backend).

## Prerequisites

- Git repository with your code
- GitHub/GitLab account
- Vercel account (free tier)
- Railway account (free tier)
- MongoDB Atlas account (free tier) or Railway PostgreSQL

## Backend Deployment (Railway)

### 1. Setup MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist all IPs (0.0.0.0/0) for Railway access
5. Get connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/holophrame`

### 2. Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect Node.js and deploy automatically

### 3. Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/holophrame
JWT_SECRET=<generate-strong-random-string>
CORS_ORIGIN=https://your-app.vercel.app
```

To generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set Root Directory (if needed)

If backend is in subdirectory:
- Settings → Root Directory → `/backend`

### 5. Custom Domain (Optional)

- Settings → Domains → Add custom domain
- Update CORS_ORIGIN with custom domain

## Frontend Deployment (Vercel)

### 1. Prepare Frontend

Update `frontend/js/main.js`:

```javascript
// Change API_BASE_URL to your Railway backend URL
const API_BASE_URL = 'https://your-app.up.railway.app/api';

// Or use environment variable
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
```

### 2. Add vercel.json Configuration

Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3. Deploy to Vercel

Option A - Via Vercel CLI:
```bash
npm i -g vercel
cd frontend
vercel
```

Option B - Via Vercel Dashboard:
1. Go to [Vercel](https://vercel.com)
2. Import Git Repository
3. Set root directory to `frontend`
4. Deploy

### 4. Configure Environment Variables

In Vercel dashboard:
- Settings → Environment Variables
- Add `VITE_API_URL` = `https://your-app.up.railway.app/api`

### 5. Update Backend CORS

Update Railway `CORS_ORIGIN` to match Vercel URL:
```
CORS_ORIGIN=https://your-app.vercel.app
```

### 6. Update WebSocket URL

In `frontend/js/websocket.js`, update:
```javascript
const wsUrl = process.env.VITE_API_URL 
    ? process.env.VITE_API_URL.replace('https://', 'wss://').replace('/api', '')
    : 'ws://localhost:3000';
```

## Alternative: Deploy Both to Railway

### Full Stack on Railway

1. Create Railway project
2. Add MongoDB Atlas connection string
3. Set environment variables
4. Railway will serve static files if configured

Add to `backend/server.js`:
```javascript
// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}
```

## Post-Deployment Checklist

### Functionality
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test post creation
- [ ] Test WebSocket connection
- [ ] Test on mobile devices
- [ ] Check browser console for errors
- [ ] Verify HTTPS is working
- [ ] Test CORS is configured correctly

### Production Features
- [ ] Verify security headers (curl -I backend-url)
- [ ] Test rate limiting (6 rapid login attempts)
- [ ] Check Winston logs in Railway dashboard
- [ ] Verify environment validation passed
- [ ] Monitor Railway logs for structured logging
- [ ] Setup domain (optional)

## Monitoring & Maintenance

### Railway
- Check logs: Project → Deployments → View Logs
- Monitor metrics: Project → Metrics
- Set up alerts: Settings → Alerts

### Vercel
- Check analytics: Project → Analytics
- View logs: Project → Logs
- Monitor performance: Project → Speed Insights

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check Railway logs for CORS-related errors
- Ensure protocol (https/http) matches

### WebSocket Connection Failed
- Check WSS protocol is used in production
- Verify Railway backend supports WebSocket
- Check browser console for connection errors

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Test connection string locally first

### Environment Variables Not Loading
- Restart Railway service after adding variables
- Redeploy Vercel after adding variables
- Check variable names match exactly

## Cost Estimates

**Free Tier Limits:**
- Railway: 500 hours/month, $5 credit
- Vercel: Unlimited bandwidth (fair use)
- MongoDB Atlas: 512MB storage, shared cluster

**Estimated monthly costs for moderate use:**
- $0 (using free tiers for <1000 users)
- ~$5-10/month (1000-5000 users)
- ~$20-50/month (5000+ users)

## Scaling Considerations

As your app grows:
1. **Database**: Upgrade MongoDB Atlas cluster
2. **Backend**: Railway auto-scales, consider dedicated plan
3. **CDN**: Vercel includes global CDN
4. **Caching**: Add Redis for sessions/cache
5. **Load Balancing**: Railway handles automatically

## Security Hardening

**Already Implemented:**
- [x] Strong JWT_SECRET validation (32+ chars required by Joi)
- [x] Rate limiting enabled (auth, posts, API)
- [x] Helmet.js security headers configured
- [x] Winston logging for monitoring
- [x] Environment validation with Joi

**Still Recommended:**
- [ ] Implement CSRF protection for forms
- [ ] Setup error alerts (Railway/external service)
- [ ] Regular dependency updates (npm audit)
- [ ] Database backups enabled (MongoDB Atlas)
- [ ] SSL/TLS certificates configured (Railway auto-configures)

## Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
