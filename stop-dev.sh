#!/bin/bash
echo "Stopping Holophrame development servers..."
pkill -f "nodemon server.js" 2>/dev/null
pkill -f "python3 -m http.server 8080" 2>/dev/null
echo "Servers stopped."
