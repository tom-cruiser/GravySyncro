#!/bin/bash

# DocArchive Full-Stack Quick Start Script
# This script helps you set up and run the complete application

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         DocArchive SaaS - Quick Start Setup                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js (v18 or higher) from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo -e "${YELLOW}⚠ MongoDB CLI not found. Please ensure MongoDB is running.${NC}"
    echo "  Install MongoDB: https://www.mongodb.com/try/download/community"
    echo "  Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
else
    echo -e "${GREEN}✓ MongoDB CLI found${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Step 1: Setting up Backend"
echo "════════════════════════════════════════════════════════════"
echo ""

cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please update it with your configuration.${NC}"
    echo ""
    echo "Important: Update the following in backend/.env:"
    echo "  - MONGODB_URI (MongoDB connection string)"
    echo "  - JWT_SECRET (random secure string)"
    echo "  - JWT_REFRESH_SECRET (another random secure string)"
    echo "  - WASABI credentials (if using Wasabi storage)"
    echo "  - Email server settings (for notifications)"
    echo ""
    read -p "Press Enter after updating the .env file..."
fi

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
if npm install; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Step 2: Setting up Frontend"
echo "════════════════════════════════════════════════════════════"
echo ""

cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
if npm install; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Check if .env exists for frontend
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=DocArchive
EOF
    echo -e "${GREEN}✓ Frontend .env file created${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "To start the application:"
echo ""
echo "  1. Start Backend (in one terminal):"
echo "     ${GREEN}cd backend && npm run dev${NC}"
echo ""
echo "  2. Start Frontend (in another terminal):"
echo "     ${GREEN}npm run dev${NC}"
echo ""
echo "  3. Open your browser:"
echo "     ${GREEN}http://localhost:5173${NC}"
echo ""
echo "  4. MongoDB should be running on:"
echo "     ${GREEN}mongodb://localhost:27017${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Quick Commands:"
echo "  - Start backend dev:  cd backend && npm run dev"
echo "  - Start frontend dev: npm run dev"
echo "  - Run backend tests:  cd backend && npm test"
echo ""
echo "Documentation:"
echo "  - Backend README:      backend/README.md"
echo "  - Integration Guide:   INTEGRATION_GUIDE.md"
echo "  - Environment Setup:   backend/.env.example"
echo ""
echo "Default Admin Credentials (after first user registration):"
echo "  - Register a user and it will be created with 'user' role"
echo "  - Change role to 'admin' in MongoDB if needed"
echo ""
echo "Need help? Check the README files or visit:"
echo "  - Express.js: https://expressjs.com/"
echo "  - React: https://react.dev/"
echo "  - MongoDB: https://www.mongodb.com/docs/"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
