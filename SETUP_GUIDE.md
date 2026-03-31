# DocArchive - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React 18
- Redux Toolkit
- React Router v6
- React Dropzone
- Lucide React (icons)
- Axios for API calls

### 2. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Comments.jsx
│   ├── DocumentCard.jsx
│   ├── DocumentList.jsx
│   ├── Layout.jsx
│   ├── NotificationPanel.jsx
│   ├── SearchBar.jsx
│   ├── ShareDocument.jsx
│   └── VersionHistory.jsx
│
├── features/           # Redux slices by feature
│   ├── auth/
│   │   └── authSlice.js
│   ├── collaboration/
│   │   └── collaborationSlice.js
│   ├── documents/
│   │   └── documentsSlice.js
│   ├── notifications/
│   │   └── notificationsSlice.js
│   └── sharing/
│       └── sharingSlice.js
│
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── Documents.jsx
│   ├── ForgotPassword.jsx
│   ├── Login.jsx
│   ├── Profile.jsx
│   ├── Register.jsx
│   └── Support.jsx
│
├── store/              # Redux store configuration
│   └── index.js
│
├── styles/             # Global styles
│   └── global.css
│
├── App.jsx            # Main app component with routing
└── main.jsx           # Application entry point
```

## 🔑 Key Features Implemented

### ✅ Authentication
- Login with two-factor authentication support
- User registration with role selection
- Password recovery
- Protected routes

### ✅ Dashboard
- Statistics overview (Total documents, uploads, notifications)
- Recent documents display
- Notification panel
- Responsive grid layout

### ✅ Document Management
- Upload documents with drag-and-drop
- Document metadata (title, description, type)
- Document list with search and filter
- File type indicators
- Encryption status badges

### ✅ Collaboration
- Document sharing with email invitations
- Permission management (View/Edit)
- Comments system with edit/delete
- Version history with revert capability

### ✅ Profile & Settings
- Edit user profile information
- Change password
- Role management
- Two-factor authentication setup

### ✅ Help & Support
- FAQ with expandable answers
- Tutorials and guides
- Contact support form
- Quick response information

### ✅ Mobile Responsive
- Collapsible sidebar on mobile
- Touch-friendly interface
- Optimized layouts for all screen sizes

## 🎨 Design Features

- **Modern UI**: Clean gradient-based design with card layouts
- **Color Coding**: Different colors for document types
- **Icons**: Lucide React icons throughout
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Keyboard navigation support
- **Dark Mode Ready**: CSS variables for easy theming

## 🔌 API Integration

The application uses mock data. To integrate with a real backend:

1. **Update API endpoints** in each component where you see:
   ```javascript
   // Mock API call - replace with actual API endpoint
   ```

2. **Create an API service layer** in `src/services/api.js`:
   ```javascript
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   });
   
   export default api;
   ```

3. **Add authentication tokens** to requests:
   ```javascript
   api.interceptors.request.use(config => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

## 🔒 Security Features

- Two-factor authentication flow
- Password strength validation
- Encrypted document indicators
- Session management
- Protected routes

## 📱 User Roles Supported

- Student
- Notary
- Teacher
- Lawyer
- Professional

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Styling**: CSS Modules with CSS Variables
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Date Handling**: date-fns

## 🎯 Next Steps

1. **Set up backend API** - Replace mock data with real API calls
2. **Add authentication persistence** - Implement JWT tokens
3. **File storage integration** - Connect to cloud storage (AWS S3, Azure Blob)
4. **Real-time features** - Add WebSocket for live notifications
5. **Advanced search** - Implement full-text search
6. **Export functionality** - Add document export features
7. **Analytics** - Track user activity and document usage
8. **Email notifications** - Set up email service integration

## 🐛 Testing

To test the application without a backend:

1. **Login**: Use any email/password combination
2. **Register**: Fill out the form (data won't persist)
3. **Upload**: Use the drag-and-drop interface
4. **Navigate**: All routes are accessible when "logged in"

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=DocArchive
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 💡 Tips

- **Development**: Use React DevTools and Redux DevTools for debugging
- **Performance**: Consider code splitting for larger deployments
- **Deployment**: Optimize build with `npm run build`
- **Testing**: Add unit tests with Jest and React Testing Library

## 🔧 Troubleshooting

### Port already in use
```bash
# Change port in vite.config.js or kill the process
lsof -ti:3000 | xargs kill
```

### Dependencies not installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build errors
```bash
# Ensure all dependencies are installed
npm ci
```

---

**Need help?** Check the Support page in the application or contact the development team.
