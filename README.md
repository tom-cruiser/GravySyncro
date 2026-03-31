# DocArchive - Multi-Tenant Document Management SaaS

A comprehensive, production-ready SaaS application for secure document archiving and collaboration, built with React, Redux, Node.js, Express, MongoDB, and Wasabi cloud storage.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Two-factor authentication (2FA) with QR code
- Password hashing with bcrypt
- Email verification and password reset
- Role-based access control (Admin, User)
- Rate limiting and brute-force protection

### 📄 Document Management
- Upload documents (PDF, DOCX, XLSX, images, etc.)
- Download with signed URLs
- Version control and history tracking
- Soft delete with restore capability
- Advanced search and filtering
- Category and tag organization

### 🤝 Collaboration
- Document sharing with granular permissions
- Comments and threaded replies
- Comment reactions
- Real-time notifications
- Activity audit logs

### ☁️ Cloud Storage
- Wasabi S3-compatible object storage
- Server-side encryption
- Image optimization
- Multi-tenant data isolation

### 📊 Dashboard & Analytics
- Document statistics
- Recent activity feed
- Storage usage tracking
- User activity logs

## 🛠 Tech Stack

### Frontend
- React 18.2.0 with Redux Toolkit
- React Router v6
- Vite 5.0.8 (build tool)
- Axios for HTTP requests
- Lucide React for icons

### Backend
- Node.js 18+ with Express.js
- MongoDB with Mongoose ODM
- Wasabi (S3-compatible storage)
- JWT authentication with 2FA
- Nodemailer for emails
- Winston for logging

## 📦 Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher
- npm or yarn package manager

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

### Manual Setup

1. **Install Dependencies:**

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

2. **Configure Environment:**

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration

# Frontend (in project root)
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env
```

3. **Start MongoDB:**

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. **Start the Application:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

5. **Access the App:**

Open your browser: `http://localhost:5173`

## 📁 Project Structure

```
archiving/
├── src/                      # Frontend source
│   ├── components/           # Reusable components
│   ├── features/            # Redux slices
│   ├── pages/               # Page components
│   └── store/               # Redux store
├── backend/                 # Backend source
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── models/         # Mongoose models
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── templates/      # Email templates
│   └── README.md
├── setup.sh                # Setup script
├── INTEGRATION_GUIDE.md    # Integration docs
└── README.md              # This file
```

## 📚 Documentation

- **Backend API**: See [backend/README.md](backend/README.md)
- **Integration Guide**: See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Environment Setup**: See [backend/.env.example](backend/.env.example)

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/2fa/setup` - Setup 2FA

### Documents
- `GET /api/v1/documents` - Get all documents
- `POST /api/v1/documents` - Upload document
- `GET /api/v1/documents/:id/download` - Download
- `POST /api/v1/documents/:id/share` - Share document

### Users
- `GET /api/v1/users/profile` - Get profile
- `PATCH /api/v1/users/profile` - Update profile

For complete API documentation, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).

## ⚙️ Configuration

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/docarchive
JWT_SECRET=your-secret-key
WASABI_ACCESS_KEY_ID=your-wasabi-key
WASABI_SECRET_ACCESS_KEY=your-wasabi-secret
WASABI_BUCKET=your-bucket-name
EMAIL_HOST=smtp.gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=DocArchive
```

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in backend/.env

**CORS Error:**
- Check ALLOWED_ORIGINS in backend/.env
- Ensure frontend URL is in allowed origins

**File Upload Error:**
- Verify Wasabi credentials
- Check bucket exists and is accessible

## 📄 License

ISC

## 🙏 Acknowledgments

Built with React, Node.js, MongoDB, and Wasabi

---

**Need help?** Check the [Integration Guide](INTEGRATION_GUIDE.md) or [Backend README](backend/README.md)
