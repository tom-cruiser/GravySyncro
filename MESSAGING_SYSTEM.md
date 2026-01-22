# Messaging & Notification System

## Overview
A complete two-way messaging system has been implemented, allowing users to contact support and admins to respond. Users receive real-time notifications when admins reply.

## Features Implemented

### 1. **Backend - Message System**
- **Model**: `backend/src/models/Message.js`
  - Fields: subject, message, status (pending/in_progress/resolved/closed), priority, category, response, respondedBy, respondedAt
  - Multi-tenant support with tenantId
  
- **Controller**: `backend/src/controllers/messageController.js`
  - `createMessage`: Creates support ticket and notifies admins
  - `getAllMessages`: Admin view with filters (status, priority, category, search)
  - `respondToMessage`: Admin response + creates notification for user
  - `updateMessage`: Update message status/priority
  - `markAsRead`: Mark messages as read
  - `getMessageStats`: Dashboard statistics

- **Routes**: `backend/src/routes/message.routes.js`
  ```
  POST   /api/messages              - Create new message
  GET    /api/messages              - Get all messages (admin)
  GET    /api/messages/user         - Get user's messages
  GET    /api/messages/:id          - Get single message
  PATCH  /api/messages/:id/respond  - Admin respond to message
  PATCH  /api/messages/:id          - Update message
  DELETE /api/messages/:id          - Delete message
  PATCH  /api/messages/:id/read     - Mark as read
  GET    /api/messages/stats        - Get statistics
  ```

### 2. **Backend - Notification Enhancement**
- **Model**: `backend/src/models/Notification.js`
  - Added notification types: `support_response` (for users), `message_received` (for admins)
  - Added `relatedMessage` field to link notifications to messages

- **Integration**:
  - When user creates message → Admin receives `message_received` notification
  - When admin responds → User receives `support_response` notification

### 3. **Frontend - Admin Interface**
- **Component**: `src/components/AdminMessages.jsx`
  - **Features**:
    - View all support messages
    - Filter by status, priority, category
    - Search messages
    - View message details
    - Inline response form
    - Update message status
    - Mark as read/unread
    - Pagination support
  
- **Integration**: Added to AdminDashboard with "Messages" tab

### 4. **Frontend - User Interface**
- **Component**: `src/pages/Support.jsx` (Enhanced with tabs)
  - **3 Tabs**:
    1. **Contact** - Submit new support request with category selection
    2. **My Messages** - View all submitted messages and admin responses
    3. **FAQ** - Frequently Asked Questions accordion
  
  - **My Messages Tab Features**:
    - List of all user's messages
    - Status badges (pending/in_progress/resolved/closed)
    - Priority indicators
    - Admin responses displayed
    - Timestamp formatting
    - Empty state for no messages

### 5. **Frontend - Notification System**
- **Component**: `src/components/NotificationPanel.jsx`
  - Real-time notification fetching (30-second polling)
  - Click notification to navigate to relevant page
  - Support message notifications show MessageCircle icon
  - Mark as read/delete actions
  - Mark all as read
  - Notification count badge

## Message Flow

### User Creates Support Request:
1. User fills form on Support page → Contact tab
2. Form submission calls `POST /api/messages`
3. Backend creates Message document
4. Backend creates `message_received` notification for all admins
5. Admins see notification bell update
6. Message appears in Admin Messages tab

### Admin Responds:
1. Admin opens Messages tab in AdminDashboard
2. Admin clicks on message to view details
3. Admin types response in inline form
4. Form submission calls `PATCH /api/messages/:id/respond`
5. Backend saves response to Message document
6. Backend creates `support_response` notification for user
7. User sees notification bell update
8. User clicks notification → Navigates to Support page
9. Message with admin response appears in "My Messages" tab

## Status Management
- **pending**: New message awaiting review
- **in_progress**: Admin is working on the issue
- **resolved**: Issue resolved, awaiting user confirmation
- **closed**: Ticket closed

## Priority Levels
- **low**: General inquiries
- **medium**: Standard issues
- **high**: Important issues
- **urgent**: Critical issues requiring immediate attention

## Categories
- General
- Technical Issue
- Billing
- Feature Request
- Bug Report
- Other

## Notification Types
- `message_received`: Admin notification when user creates message
- `support_response`: User notification when admin responds

## Testing Checklist

### Backend Testing:
- [ ] Create message as user
- [ ] Verify admin receives notification
- [ ] View all messages as admin
- [ ] Filter messages by status/priority/category
- [ ] Respond to message as admin
- [ ] Verify user receives notification
- [ ] Update message status
- [ ] Delete message
- [ ] Check message statistics

### Frontend Testing:
- [ ] Submit support request from Support page
- [ ] Verify success message appears
- [ ] Check "My Messages" tab shows new message
- [ ] As admin, check Messages tab shows new message
- [ ] As admin, respond to message
- [ ] As user, check notification bell shows new notification
- [ ] Click notification, verify navigation to Support page
- [ ] Verify response appears in "My Messages" tab
- [ ] Test all tab navigation (Contact, My Messages, FAQ)
- [ ] Test FAQ accordion expand/collapse

## Files Modified/Created

### Backend:
- ✅ `backend/src/models/Message.js` (created)
- ✅ `backend/src/controllers/messageController.js` (created)
- ✅ `backend/src/routes/message.routes.js` (created)
- ✅ `backend/src/models/Notification.js` (modified)
- ✅ `backend/src/app.js` (modified - added message routes)

### Frontend:
- ✅ `src/components/AdminMessages.jsx` (created)
- ✅ `src/components/AdminMessages.css` (created)
- ✅ `src/pages/Support.jsx` (modified - added tabs and My Messages)
- ✅ `src/pages/AdminDashboard.jsx` (modified - added Messages tab)
- ✅ `src/components/NotificationPanel.jsx` (modified - real-time fetching)

## Next Steps
1. Add email notifications when admin responds (optional)
2. Add file attachment support for messages (optional)
3. Add message threading for follow-up questions (optional)
4. Add message templates for common admin responses (optional)
5. Add analytics dashboard for message metrics (optional)
