it# Notification Bell Integration

## Overview

The notification bell has been fully integrated to show unread message counts and provide quick access to notifications.

## Features Implemented

### ✅ Notification Bell Badge

- **Location**: Header (Layout component)
- **Displays**: Real-time unread notification count
- **Updates**: Automatically when new messages are received or notifications are marked as read

### ✅ Notification Panel Dropdown

- **Trigger**: Click the bell icon in the header
- **Features**:
  - Dropdown panel showing all notifications
  - Unread count badge in header
  - "Mark all as read" button
  - Individual notification actions (mark as read, delete)
  - Click notification to navigate to relevant page
  - Auto-refreshes every 30 seconds

### ✅ Smart Navigation

When clicking on a notification, the system automatically navigates to the appropriate page:

**For Users:**

- `support_response` notification → Support page (My Messages tab)

**For Admins:**

- `message_received` notification → Admin Dashboard (Messages tab)

**For All:**

- `document_shared` / `document_uploaded` → Documents page

### ✅ Unread Count Management

The notification count automatically:

- **Increments** when new messages/responses are created
- **Decrements** when notifications are marked as read
- **Updates** in real-time (30-second polling)
- **Syncs** across all pages

## Files Modified

### Backend

1. **`backend/src/routes/message.routes.js`**
   - Changed route from `/my-messages` to `/user` for consistency

### Frontend

2. **`src/components/Layout.jsx`**
   - Added NotificationPanel import and state
   - Added click handler to notification bell button
   - Added notification panel dropdown with overlay
   - Shows unread count badge on bell icon

3. **`src/components/Layout.css`**
   - Added `.notification-overlay` styling for dropdown backdrop

4. **`src/components/NotificationPanel.jsx`**
   - Enhanced navigation with state passing to set active tabs
   - Smart routing for users vs admins
   - Separate handling for `support_response` and `message_received` types

5. **`src/components/NotificationPanel.css`**
   - Updated to display as dropdown panel
   - Added fixed positioning (top-right corner)
   - Added slide-down animation
   - Increased z-index for proper layering

6. **`src/pages/Support.jsx`**
   - Added `useLocation` hook to receive navigation state
   - Automatically switches to "My Messages" tab when navigating from notification
   - Updated API endpoint from `/my-messages` to `/user`

7. **`src/pages/AdminDashboard.jsx`**
   - Added `useLocation` hook to receive navigation state
   - Automatically switches to "Messages" tab when navigating from notification

## How It Works

### User Flow (User receives admin response):

1. Admin responds to user's support message
2. Backend creates `support_response` notification for user
3. User sees notification count increase on bell icon (e.g., shows "1")
4. User clicks bell → Notification panel drops down
5. User sees "Admin responded to your message" notification
6. User clicks notification → Navigates to Support page, "My Messages" tab
7. User sees admin's response
8. Notification automatically marked as read
9. Bell badge count decreases (e.g., back to "0")

### Admin Flow (Admin receives new message):

1. User submits support request from Support page
2. Backend creates `message_received` notification for all admins
3. Admin sees notification count increase on bell icon
4. Admin clicks bell → Notification panel drops down
5. Admin sees "New Support Message" notification
6. Admin clicks notification → Navigates to Admin Dashboard, "Messages" tab
7. Admin sees the new message and can respond
8. Notification automatically marked as read
9. Bell badge count decreases

## Notification Badge States

### Badge Display:

- **Hidden**: When `unreadCount === 0` (no unread notifications)
- **Visible**: When `unreadCount > 0` (shows the number)
- **Maximum**: Shows actual count (no "99+" limit currently)

### Badge Updates:

- ✅ Auto-refreshes every 30 seconds via polling
- ✅ Updates immediately when marking as read
- ✅ Updates immediately when deleting notification
- ✅ Updates immediately when marking all as read
- ✅ Persists across page navigation (Redux store)

## Redux State Management

The notification count is managed in Redux store:

```javascript
// Store structure
{
  notifications: {
    notifications: [...],
    unreadCount: 5  // Calculated automatically
  }
}
```

### Actions that update count:

- `setNotifications()` - Recalculates count from notification list
- `markAsRead()` - Decrements count by 1
- `markAllAsRead()` - Sets count to 0
- `deleteNotification()` - Decrements count if notification was unread
- `addNotification()` - Increments count by 1

## Testing Checklist

### User Testing:

- [ ] User submits support request → Admin receives notification
- [ ] Admin bell shows count (e.g., "1")
- [ ] Admin clicks bell → Panel opens
- [ ] Admin clicks notification → Navigates to Messages tab
- [ ] Count decreases to 0

### Admin Response Testing:

- [ ] Admin responds to message → User receives notification
- [ ] User bell shows count
- [ ] User clicks bell → Panel opens
- [ ] User clicks notification → Navigates to "My Messages" tab
- [ ] User sees admin response
- [ ] Count decreases to 0

### General Testing:

- [ ] Bell badge appears only when unreadCount > 0
- [ ] Badge shows correct number
- [ ] Clicking outside panel closes it
- [ ] Panel displays all notifications
- [ ] "Mark all as read" works correctly
- [ ] Individual "mark as read" works
- [ ] Delete notification works
- [ ] Polling updates notifications every 30s

## Styling Details

### Notification Bell Button:

- Fixed in header (top-right)
- Red badge with white text
- Badge positioned absolutely on top-right of bell icon

### Notification Panel:

- Width: 420px
- Max height: 600px
- Position: Fixed, top-right corner (below header)
- Shadow: 0 10px 40px rgba(0, 0, 0, 0.15)
- Animation: Slide down from top (0.2s)
- Z-index: 1000 (above all content)

### Overlay:

- Full screen backdrop
- Semi-transparent black (rgba(0, 0, 0, 0.5))
- Z-index: 99 (below panel)
- Closes panel when clicked

## Next Steps (Optional Enhancements)

1. Add real-time updates via WebSocket instead of polling
2. Add notification sound when new message arrives
3. Add "Clear all" button to delete all notifications
4. Add notification grouping (e.g., "3 new messages")
5. Add notification preferences (enable/disable types)
6. Add desktop notifications (browser API)
7. Add notification history page
