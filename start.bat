@echo off

REM Start backend in a new window
cd backend
start "" npx convex dev
cd ..

REM Start frontend in a new window
cd frontend
start "" npm run dev
cd ..

REM Open browser
start http://localhost:3000