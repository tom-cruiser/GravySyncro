# 📋 DocArchive Setup Checklist

Use this checklist to ensure your DocArchive SaaS application is properly configured and running.

## ✅ Pre-Setup Requirements

### System Requirements
- [ ] Node.js v18+ installed
  ```bash
  node --version  # Should show v18.0.0 or higher
  ```
- [ ] npm or yarn installed
  ```bash
  npm --version
  ```
- [ ] MongoDB installed or Docker available
  ```bash
  mongosh --version  # OR
  docker --version
  ```
- [ ] Git installed (optional)
  ```bash
  git --version
  ```

## ✅ Backend Setup

### 1. Install Backend Dependencies
- [ ] Navigate to backend directory
  ```bash
  cd backend
  ```
- [ ] Install npm packages
  ```bash
  npm install
  ```
- [ ] Verify package installation (should show no errors)

### 2. Configure Backend Environment
- [ ] Copy environment template
  ```bash
  cp .env.example .env
  ```
- [ ] Edit `backend/.env` and configure:
  - [ ] `MONGODB_URI` - MongoDB connection string
  - [ ] `JWT_SECRET` - Generate random string (min 32 chars)
  - [ ] `JWT_REFRESH_SECRET` - Generate another random string
  - [ ] `WASABI_ACCESS_KEY_ID` - Wasabi access key (optional for testing)
  - [ ] `WASABI_SECRET_ACCESS_KEY` - Wasabi secret key (optional)
  - [ ] `WASABI_BUCKET` - Wasabi bucket name (optional)
  - [ ] `EMAIL_HOST` - SMTP host (e.g., smtp.gmail.com)
  - [ ] `EMAIL_USERNAME` - Your email address
  - [ ] `EMAIL_PASSWORD` - Email password or app password
  - [ ] `FRONTEND_URL` - Frontend URL (http://localhost:5173)
  - [ ] `ALLOWED_ORIGINS` - Allowed CORS origins

### 3. Generate Secrets (Optional)
Generate secure random strings for JWT secrets:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Verify Backend Configuration
- [ ] All required environment variables are set
- [ ] MongoDB connection string is correct
- [ ] Email credentials are valid
- [ ] Secrets are secure and random

## ✅ Frontend Setup

### 1. Install Frontend Dependencies
- [ ] Navigate to project root
  ```bash
  cd ..  # from backend directory
  ```
- [ ] Install npm packages
  ```bash
  npm install
  ```
- [ ] Verify package installation

### 2. Configure Frontend Environment
- [ ] Create `.env` file in project root
  ```bash
  cat > .env << EOF
  VITE_API_BASE_URL=http://localhost:5000/api/v1
  VITE_APP_NAME=DocArchive
  EOF
  ```
- [ ] Verify `.env` file exists and contains correct API URL

## ✅ Database Setup

### Option 1: Using Docker (Recommended)
- [ ] Start MongoDB container
  ```bash
  docker run -d -p 27017:27017 --name mongodb mongo:latest
  ```
- [ ] Verify MongoDB is running
  ```bash
  docker ps | grep mongodb
  ```

### Option 2: Local MongoDB
- [ ] Start MongoDB service
  ```bash
  sudo systemctl start mongod  # Linux
  brew services start mongodb-community  # Mac
  ```
- [ ] Verify MongoDB is running
  ```bash
  mongosh  # Should connect successfully
  ```

### Verify Database Connection
- [ ] Test MongoDB connection:
  ```bash
  mongosh mongodb://localhost:27017/docarchive
  ```
- [ ] Should see "Connected to MongoDB" message

## ✅ Wasabi Storage Setup (Optional for Testing)

### For Production Use:
- [ ] Create Wasabi account at https://wasabi.com/
- [ ] Create a bucket
- [ ] Generate access keys
- [ ] Update backend/.env with Wasabi credentials
- [ ] Test upload by starting the application

### For Testing/Development:
- [ ] Can skip Wasabi setup initially
- [ ] File upload will fail without Wasabi configured
- [ ] Set up later when ready for storage testing

## ✅ Email Service Setup

### Gmail Setup:
- [ ] Enable 2-Step Verification on your Google account
- [ ] Generate App Password:
  1. Go to Google Account → Security
  2. Select "App passwords"
  3. Generate password for "Mail"
  4. Copy the 16-character password
- [ ] Update backend/.env with:
  ```env
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USERNAME=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  ```

### Alternative Email Services:
- [ ] SendGrid
- [ ] Mailgun
- [ ] AWS SES
- [ ] Postmark

## ✅ Start the Application

### 1. Start MongoDB
- [ ] Ensure MongoDB is running (see Database Setup above)

### 2. Start Backend Server
- [ ] Open Terminal 1
- [ ] Navigate to backend directory
  ```bash
  cd backend
  ```
- [ ] Start development server
  ```bash
  npm run dev
  ```
- [ ] Verify output shows:
  - [ ] "🚀 Server running in development mode on port 5000"
  - [ ] "Connected to MongoDB"
- [ ] Backend should be accessible at: http://localhost:5000

### 3. Start Frontend Development Server
- [ ] Open Terminal 2
- [ ] Navigate to project root
  ```bash
  cd /home/zoe/Desktop/project/saas/archiving
  ```
- [ ] Start development server
  ```bash
  npm run dev
  ```
- [ ] Verify output shows:
  - [ ] "VITE ready in xxx ms"
  - [ ] "Local: http://localhost:5173"
- [ ] Frontend should be accessible at: http://localhost:5173

## ✅ Verify Installation

### 1. Test Backend API
- [ ] Open browser or use curl:
  ```bash
  curl http://localhost:5000/health
  ```
- [ ] Should return JSON: `{"status":"success","message":"Server is running"}`

### 2. Test Frontend
- [ ] Open browser: http://localhost:5173
- [ ] Should see DocArchive login page
- [ ] No console errors in browser DevTools

### 3. Test Registration Flow
- [ ] Click "Sign Up" or "Register"
- [ ] Fill in registration form:
  - First Name: Test
  - Last Name: User
  - Email: test@example.com
  - Password: Test123!@#
  - Confirm Password: Test123!@#
- [ ] Click "Register"
- [ ] Should see success message or redirect to verification page
- [ ] Check email for verification link (if email configured)

### 4. Test Login
- [ ] Navigate to login page
- [ ] Enter credentials:
  - Email: test@example.com
  - Password: Test123!@#
- [ ] Click "Login"
- [ ] Should redirect to dashboard
- [ ] Dashboard should display:
  - [ ] User name
  - [ ] Statistics (even if 0)
  - [ ] Navigation menu

### 5. Test Document Upload (Optional - Requires Wasabi)
- [ ] Navigate to Documents page
- [ ] Click "Upload Document"
- [ ] Select a file
- [ ] Fill in document details
- [ ] Click "Upload"
- [ ] If Wasabi configured: should upload successfully
- [ ] If Wasabi not configured: will show error (expected)

## ✅ Troubleshooting

### Backend Won't Start
- [ ] Check MongoDB is running
  ```bash
  docker ps  # OR
  sudo systemctl status mongod
  ```
- [ ] Verify port 5000 is not in use
  ```bash
  lsof -i :5000
  ```
- [ ] Check backend/.env file exists and is configured
- [ ] Check terminal for error messages

### Frontend Won't Start
- [ ] Verify port 5173 is not in use
  ```bash
  lsof -i :5173
  ```
- [ ] Check .env file exists in project root
- [ ] Clear npm cache and reinstall
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### MongoDB Connection Error
- [ ] Verify MongoDB is running
- [ ] Check MONGODB_URI in backend/.env
- [ ] Try connecting with mongosh:
  ```bash
  mongosh mongodb://localhost:27017/docarchive
  ```

### CORS Error in Browser
- [ ] Check ALLOWED_ORIGINS in backend/.env includes frontend URL
- [ ] Restart backend server after changing .env
- [ ] Clear browser cache

### Email Not Sending
- [ ] Verify email credentials in backend/.env
- [ ] Check EMAIL_HOST and EMAIL_PORT are correct
- [ ] For Gmail: ensure app password is used (not regular password)
- [ ] Check spam folder

### File Upload Error
- [ ] Verify Wasabi credentials in backend/.env
- [ ] Check bucket name is correct
- [ ] Ensure bucket exists and is accessible
- [ ] For testing: can skip Wasabi and test other features

## ✅ Optional Enhancements

### Redis Setup (For Queues)
- [ ] Install Redis
  ```bash
  docker run -d -p 6379:6379 --name redis redis:latest
  ```
- [ ] Update backend/.env
  ```env
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```

### MongoDB Compass (GUI)
- [ ] Download from https://www.mongodb.com/try/download/compass
- [ ] Connect to: mongodb://localhost:27017
- [ ] Browse collections: users, documents, comments, etc.

### API Testing with Postman
- [ ] Download Postman from https://www.postman.com/
- [ ] Import API endpoints
- [ ] Test API calls with authentication

## ✅ Production Checklist (When Ready)

### Security
- [ ] Change all default secrets
- [ ] Use environment-specific secrets
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring

### Database
- [ ] Use MongoDB Atlas or managed MongoDB
- [ ] Set up regular backups
- [ ] Configure replication
- [ ] Set up monitoring

### Storage
- [ ] Configure Wasabi bucket with encryption
- [ ] Set up CDN if needed
- [ ] Configure backup policies

### Deployment
- [ ] Build frontend: `npm run build`
- [ ] Deploy backend to hosting platform
- [ ] Deploy frontend to hosting platform
- [ ] Update environment variables
- [ ] Test production deployment
- [ ] Set up CI/CD pipeline

## 📝 Quick Reference

### Start Commands
```bash
# Start MongoDB (Docker)
docker start mongodb

# Start Backend
cd backend && npm run dev

# Start Frontend
npm run dev
```

### Stop Commands
```bash
# Stop Backend: Ctrl+C in terminal
# Stop Frontend: Ctrl+C in terminal

# Stop MongoDB
docker stop mongodb
```

### Useful URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health
- MongoDB: mongodb://localhost:27017

## 🎉 Success!

If all items are checked, your DocArchive SaaS application is ready to use!

### Next Steps:
1. ✅ Register a user account
2. ✅ Upload your first document
3. ✅ Share a document with another user
4. ✅ Add comments to a document
5. ✅ Explore all features

### Need Help?
- Check [README.md](README.md)
- Review [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- See [backend/README.md](backend/README.md)
- Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**Happy DocArchiving! 📄🚀**
