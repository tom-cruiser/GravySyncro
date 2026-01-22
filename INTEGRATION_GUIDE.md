# Full-Stack Document Archiving SaaS - Integration Guide

This guide explains how the React frontend integrates with the Node.js backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages     │  │  Components  │  │ Redux Store  │       │
│  │ (UI Layer)  │  │  (Reusable)  │  │ (State Mgmt) │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│           │              │                  │                │
│           └──────────────┴──────────────────┘                │
│                          │                                   │
│                    ┌─────▼─────┐                            │
│                    │   Axios   │                            │
│                    │  (HTTP)   │                            │
│                    └─────┬─────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │
                     HTTP/HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Backend (Node.js)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Routes    │─▶│ Controllers  │─▶│   Models     │       │
│  │ (API Layer) │  │ (Logic)      │  │ (Database)   │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                  │               │
│         │           ┌─────▼─────┐      ┌────▼────┐         │
│         │           │ Services  │      │ MongoDB │         │
│         │           │(Email,etc)│      └─────────┘         │
│         │           └───────────┘                           │
│         │                                                    │
│    ┌────▼────────┐                                         │
│    │ Middleware  │                                         │
│    │Auth,Validate│                                         │
│    └─────────────┘                                         │
│                                                              │
│    ┌──────────────┐                                        │
│    │   Wasabi S3  │                                        │
│    │   Storage    │                                        │
│    └──────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## API Base URL Configuration

### Frontend Configuration

Update your frontend's API base URL in `src/store/index.js`:

```javascript
import axios from 'axios';

// Set API base URL
axios.defaults.baseURL = 'http://localhost:5000/api/v1';

// Add interceptor to include auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Backend CORS Configuration

The backend is configured in `src/app.js` to accept requests from the frontend:

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
```

## Authentication Flow

### 1. Registration

**Frontend (Register.jsx):**
```javascript
dispatch(register({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'SecurePass123!'
}));
```

**Backend (authController.register):**
- Validates input with Joi schema
- Checks if user exists
- Hashes password with bcrypt
- Creates user in MongoDB
- Sends verification email
- Returns JWT token

**API Endpoint:** `POST /api/v1/auth/register`

### 2. Login

**Frontend (Login.jsx):**
```javascript
dispatch(login({
  email: 'john@example.com',
  password: 'SecurePass123!',
  twoFactorCode: '123456' // if 2FA enabled
}));
```

**Backend (authController.login):**
- Validates credentials
- Checks 2FA if enabled
- Updates last login
- Returns JWT token + refresh token

**API Endpoint:** `POST /api/v1/auth/login`

### 3. Protected Routes

**Frontend (App.jsx):**
```javascript
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**Backend (auth middleware):**
```javascript
router.use(protect); // Validates JWT token
```

## Document Management Flow

### 1. Upload Document

**Frontend (Documents.jsx):**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'My Document');
formData.append('category', 'Contract');
formData.append('tags', 'important,legal');

dispatch(uploadDocument(formData));
```

**Backend (documentController.uploadDocument):**
- Validates file (multer middleware)
- Processes image if needed (sharp)
- Uploads to Wasabi S3
- Creates document record in MongoDB
- Logs activity
- Returns document object

**API Endpoint:** `POST /api/v1/documents`

### 2. List Documents

**Frontend (Documents.jsx):**
```javascript
dispatch(fetchDocuments({
  page: 1,
  limit: 20,
  search: 'contract',
  category: 'Legal',
  sortBy: '-createdAt'
}));
```

**Backend (documentController.getAllDocuments):**
- Builds query with filters
- Checks permissions
- Returns paginated results
- Includes user info (populated)

**API Endpoint:** `GET /api/v1/documents?page=1&limit=20&search=contract`

### 3. Download Document

**Frontend (DocumentCard.jsx):**
```javascript
const response = await axios.get(`/documents/${id}/download`);
window.location.href = response.data.data.url; // Signed URL
```

**Backend (documentController.downloadDocument):**
- Checks permissions
- Generates Wasabi signed URL (15 min expiry)
- Logs download activity
- Returns signed URL

**API Endpoint:** `GET /api/v1/documents/:id/download`

### 4. Share Document

**Frontend (ShareDocument.jsx):**
```javascript
dispatch(shareDocument({
  documentId: doc._id,
  userId: user._id,
  permission: 'view' // or 'edit'
}));
```

**Backend (documentController.shareDocument):**
- Validates document exists
- Checks share permissions
- Adds user to sharedWith array
- Sends email notification
- Returns updated document

**API Endpoint:** `POST /api/v1/documents/:id/share`

## Collaboration Features

### 1. Add Comment

**Frontend (Comments.jsx):**
```javascript
dispatch(addComment({
  documentId: doc._id,
  content: 'This looks great!',
  parentId: null // or parent comment ID for replies
}));
```

**Backend (commentController.addComment):**
- Validates access to document
- Creates comment
- Sends notification to document owner
- Returns comment with author info

**API Endpoint:** `POST /api/v1/comments/document/:documentId`

### 2. Real-time Notifications

**Frontend (NotificationPanel.jsx):**
```javascript
// Poll for notifications every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    dispatch(fetchNotifications());
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

**Backend (notificationController.getNotifications):**
- Returns user's notifications
- Includes unread count
- Populated with related user/document

**API Endpoint:** `GET /api/v1/notifications`

## State Management (Redux)

### Auth Slice

```javascript
// Store token after login
localStorage.setItem('token', action.payload.token);

// Add token to all requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Clear on logout
localStorage.removeItem('token');
delete axios.defaults.headers.common['Authorization'];
```

### Documents Slice

```javascript
const documentsSlice = createSlice({
  name: 'documents',
  initialState: {
    documents: [],
    loading: false,
    error: null,
    currentDocument: null,
    total: 0,
    page: 1
  },
  reducers: {
    // Handle document operations
  }
});
```

## Error Handling

### Frontend

```javascript
try {
  const response = await axios.post('/documents', formData);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    const message = error.response.data.message;
    dispatch(setError(message));
  } else if (error.request) {
    // No response from server
    dispatch(setError('Network error. Please try again.'));
  }
}
```

### Backend

```javascript
// Operational errors
throw new AppError('Document not found', 404);

// Async error handling
exports.getDocument = catchAsync(async (req, res, next) => {
  // Code that might throw errors
});

// Global error handler
app.use(errorHandler);
```

## Environment Variables

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=DocArchive
```

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/docarchive
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
WASABI_ACCESS_KEY_ID=your-wasabi-key
WASABI_SECRET_ACCESS_KEY=your-wasabi-secret
WASABI_BUCKET=docarchive-files
WASABI_ENDPOINT=s3.wasabisys.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Running the Full Stack

### 1. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use local MongoDB
mongod
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Start Frontend

```bash
cd ../  # from root
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 4. Test the Integration

1. Open browser: `http://localhost:5173`
2. Register a new account
3. Login with credentials
4. Upload a document
5. Share with another user
6. Add comments
7. Check notifications

## API Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    "document": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Contract.pdf",
      "size": 1024576,
      "mimeType": "application/pdf",
      "uploadedBy": {
        "_id": "507f191e810c19729de860ea",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Error Response

```json
{
  "status": "fail",
  "message": "Document not found",
  "stack": "..." // only in development
}
```

## Security Considerations

### Frontend
- Store JWT in localStorage (or httpOnly cookie for better security)
- Include token in Authorization header
- Validate user input before sending
- Handle token expiration (refresh token flow)

### Backend
- Validate all inputs with Joi
- Rate limit requests
- Sanitize MongoDB queries
- Use helmet for security headers
- Hash passwords with bcrypt
- Sign JWTs with strong secret
- Set token expiration
- Implement CORS properly
- Log all activities

## Multi-Tenancy Implementation

### Backend
All queries filter by tenantId:

```javascript
const documents = await Document.find({
  tenantId: req.user.tenantId,
  uploadedBy: req.user._id
});
```

### Frontend
Tenant is automatically handled by backend based on authenticated user's token.

## WebSocket Integration (Future Enhancement)

For real-time features:

```javascript
// Backend (socket.io)
io.on('connection', (socket) => {
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
  });
  
  socket.on('new-comment', (data) => {
    io.to(data.documentId).emit('comment-added', data);
  });
});

// Frontend
const socket = io('http://localhost:5000');
socket.emit('join-document', documentId);
socket.on('comment-added', (comment) => {
  dispatch(addCommentToStore(comment));
});
```

## Deployment

### Backend
- Deploy to: Heroku, AWS, DigitalOcean, Railway
- Use process manager: PM2
- Set NODE_ENV=production
- Use MongoDB Atlas for database
- Configure Wasabi bucket
- Set up email service (SendGrid, Mailgun)

### Frontend
- Deploy to: Vercel, Netlify, AWS S3 + CloudFront
- Build: `npm run build`
- Set VITE_API_BASE_URL to production backend URL

## Monitoring & Logging

### Backend Logs
- Winston logs to files and console
- Morgan logs HTTP requests
- Activity logs in MongoDB (ActivityLog model)

### Error Tracking
- Use Sentry for error tracking
- Monitor API response times
- Track failed login attempts
- Monitor storage usage

## Testing

### Backend
```bash
npm test
```

### Frontend
```bash
npm test
```

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Wasabi Documentation](https://wasabi.com/help/)
