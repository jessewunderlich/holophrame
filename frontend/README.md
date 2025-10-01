# Holophrame Frontend

Static HTML/CSS/JavaScript frontend with brutalist design aesthetic.

## Setup

1. Open `index.html` in a web browser, or use a local server:

```bash
# Using Python 3
python -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

2. Update API endpoint in `js/main.js` if backend is not running on `localhost:3000`:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

3. Navigate to `http://localhost:8080` in your browser.

## Structure

```
frontend/
├── index.html          # Landing page
├── login.html          # Login page
├── register.html       # Registration page
├── feed.html           # Main chronological feed
├── profile.html        # User profiles (to be created)
├── css/
│   └── style.css       # Brutalist design system
└── js/
    ├── main.js         # Core utilities and API functions
    ├── auth.js         # Authentication logic
    └── feed.js         # Feed functionality
```

## Design System

### Colors
- Background: `#FFFFFF` (white)
- Text: `#000000` (black)
- Links: `#0000EE` (classic blue)
- Visited links: `#551A8B` (purple)
- Hover: `#FFFF00` (yellow background)

### Typography
- Primary font: Times New Roman
- Fallback: Times, serif

### Principles
- No animations or transitions
- Minimal JavaScript
- Raw HTML structure
- Hard edges, stark contrasts
- Function over form
- Semantic HTML for accessibility

## Key Features

- **Static HTML pages** - Progressive enhancement approach
- **Vanilla JavaScript** - No frameworks or libraries
- **Local storage auth** - JWT tokens stored client-side
- **Chronological display** - No algorithmic sorting
- **Mobile responsive** - Desktop-first design

## Browser Support

Modern browsers with ES6+ support:
- Chrome/Edge 60+
- Firefox 60+
- Safari 12+

## Development

No build process required. Edit HTML/CSS/JS directly and refresh browser.

### Adding New Pages

1. Create new HTML file following existing structure
2. Link to `css/style.css`
3. Include `js/main.js` for utilities
4. Add navigation links to all pages

### Styling Guidelines

- Use semantic HTML elements
- Avoid div-soup where possible
- Use default HTML styling where appropriate
- Keep CSS minimal and explicit
- No preprocessors or CSS frameworks
