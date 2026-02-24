#!/bin/bash
echo "Starting Holophrame development servers..."

# Start backend
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend && python3 -m http.server 8080 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
