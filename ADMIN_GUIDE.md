# Admin Dashboard - Complete Guide

## Overview
The Admin Dashboard provides comprehensive monitoring and management capabilities across all tenants in the SaaS application. Admins can view system-wide statistics, manage users, monitor activity, and oversee tenant operations.

## Making a User an Admin

To promote a user to Admin role:

```bash
cd backend
node make-admin.js <user-email>
```

Example:
```bash
node make-admin.js tomyrret@gmail.com
```

## Accessing the Admin Dashboard

1. **Login** with an Admin account
2. Click **Admin** in the sidebar navigation
3. Access URL: `http://localhost:5173/admin`

**Note:** The Admin link only appears for users with the Admin role.

## Admin Dashboard Features

### 1. Overview Tab

**Statistics Cards:**
- **Total Users**: Total users across all tenants (with active users count)
- **Total Tenants**: Number of organizations in the system
- **Total Documents**: Files stored across all tenants
- **Recent Activity**: Actions in the last 24 hours

**User Growth Chart:**
- Visual representation of user registrations over the last 7 days
- Bar chart with daily counts

**Storage Usage:**
- System-wide storage consumption
- Visual progress bar

### 2. Users Tab

**User Management:**
- **Search**: Find users by name or email
- **Filters**:
  - Role: Admin, Teacher, Student, All
  - Status: Active, Inactive, All
- **Actions per user**:
  - **Deactivate**: Disable user account (requires reason)
  - **Activate**: Re-enable deactivated account
  - **Delete**: Permanently remove user and related data (requires confirmation)

**User Information Displayed:**
- Avatar with initials
- Full name and email
- Role badge (color-coded)
- Status badge (Active/Inactive)
- Tenant ID
- Registration date

**Features:**
- Real-time user status updates
- Confirmation modals for destructive actions
- Activity logging for all admin actions

### 3. Tenants Tab

**Tenant Overview:**
- **Summary Statistics**:
  - Total number of tenants
  - Aggregate user count
  - Total documents across all tenants

**Tenant Cards Display:**
- Primary user (tenant owner) avatar and name
- Tenant ID (truncated)
- Statistics:
  - 👥 Number of users
  - 📄 Number of documents
  - 💬 Number of comments
- **Storage Usage**:
  - Visual progress bar
  - Percentage used
  - Bytes used / 5 GB limit
- **Dates**:
  - Created date
  - Last activity date

**Tenant Details Modal:**
- Full tenant ID
- Primary user information (name, email)
- Creation timestamp
- **Complete user list** for the tenant:
  - User avatars
  - Names and emails
  - Role badges
  - Status badges
- View individual users within tenant context

### 4. Activity Tab

**Activity Logs:**
- Cross-tenant activity monitoring
- All user actions across the system

**Filters:**
- **Search**: Filter by user name or email
- **Action Type**: 
  - Login/Logout
  - Register
  - Upload/Download/Delete Document
  - Share Document
  - Add Comment
  - Update Profile
  - Change Password
- **Date Range**:
  - Start date
  - End date
- **Clear Filters** button

**Activity Log Display:**
- **Date & Time**: Precise timestamp
- **User Information**:
  - Avatar
  - Full name
  - Email
- **Action Badge**: Color-coded by action type
  - 🔵 Auth actions (login, register)
  - 🟢 Create actions (upload, share)
  - 🔴 Delete actions
  - 🟠 Read actions (download)
  - 🟣 Update actions
- **Details**: Additional context about the action
- **IP Address**: Source IP of the request
- **Tenant ID**: Which tenant the action belongs to

**Pagination:**
- 50 activities per page
- Previous/Next navigation
- Current page indicator

### 5. Documents Tab

**Status:** Coming soon
- Cross-tenant document browser
- Document search and filters
- Document details and metadata

## Security & Access Control

### Route Protection
- Admin routes are protected by `AdminRoute` guard
- Checks:
  1. User is authenticated
  2. User role is "Admin"
- Non-admin users are redirected to dashboard
- Unauthenticated users are redirected to login

### Backend Authorization
All admin API endpoints require:
```javascript
router.use(protect, restrictTo('Admin'));
```

### Admin API Endpoints

**Dashboard Statistics:**
```
GET /api/v1/admin/dashboard/stats
```
Returns: Total users, tenants, documents, activity, user growth data

**User Management:**
```
GET /api/v1/admin/users?page=1&limit=50&search=&role=&status=
GET /api/v1/admin/users/:userId
PATCH /api/v1/admin/users/:userId/deactivate
PATCH /api/v1/admin/users/:userId/activate
DELETE /api/v1/admin/users/:userId
PATCH /api/v1/admin/users/:userId/role
```

**Tenant Management:**
```
GET /api/v1/admin/tenants
GET /api/v1/admin/tenants/:tenantId
```

**Activity Monitoring:**
```
GET /api/v1/admin/activities?page=1&limit=50&search=&action=&startDate=&endDate=
```

**Document Management:**
```
GET /api/v1/admin/documents
```

## Admin Responsibilities

### User Management
1. **Monitor User Activity**: Track logins, uploads, and actions
2. **Handle Violations**: Deactivate users for policy violations
3. **User Support**: Reactivate accounts after issues resolved
4. **Role Management**: Update user roles as needed

### System Monitoring
1. **Check Statistics Regularly**: Monitor growth trends
2. **Storage Management**: Track storage usage across tenants
3. **Activity Oversight**: Review unusual or suspicious activity
4. **Tenant Health**: Ensure tenants are active and healthy

### Best Practices
1. **Always provide reasons** when deactivating users
2. **Confirm before deleting** - deletions are permanent
3. **Monitor activity logs** for security concerns
4. **Track tenant growth** and resource usage
5. **Use search and filters** to find specific users/activities quickly

## Common Admin Tasks

### Deactivating a User
1. Go to **Admin → Users** tab
2. Find the user (search if needed)
3. Click **Deactivate** button
4. Enter a reason (required)
5. Confirm action
6. User immediately loses access

### Reactivating a User
1. Go to **Admin → Users** tab
2. Filter by **Status: Inactive**
3. Find the user
4. Click **Activate** button
5. User can immediately log in again

### Deleting a User
1. Go to **Admin → Users** tab
2. Find the user
3. Click **Delete** button
4. Type "DELETE" to confirm (case-sensitive)
5. User and all related data permanently removed

### Viewing Tenant Activity
1. Go to **Admin → Tenants** tab
2. Find the tenant card
3. Click **View Details**
4. Modal shows:
   - Tenant information
   - All users in that tenant
   - User roles and statuses

### Monitoring Recent Activity
1. Go to **Admin → Activity** tab
2. Use filters to narrow down:
   - Specific user
   - Action type
   - Date range
3. Review activity details
4. Check IP addresses for suspicious patterns

### Searching Users
1. Go to **Admin → Users** tab
2. Type in search box:
   - User name (first or last)
   - Email address
3. Results update automatically
4. Combine with role/status filters for precision

## Troubleshooting

### Admin Link Not Visible
- Verify your user has role "Admin"
- Check: `db.users.findOne({email: "your@email.com"})`
- Run: `node make-admin.js your@email.com`
- Log out and log back in

### 403 Forbidden Error
- Your user doesn't have Admin role
- Token might be expired - refresh the page
- Check backend logs for authorization errors

### Activity Logs Not Loading
- Check backend is running
- Verify MongoDB connection
- Check browser console for errors
- Ensure ActivityLog collection has data

### Statistics Showing Zero
- Database might be empty
- Check MongoDB collections have data
- Verify backend aggregation queries working
- Check backend logs for errors

## Technical Implementation

### Frontend Structure
```
src/
├── pages/
│   └── AdminDashboard.jsx     # Main admin dashboard with tabs
├── components/
│   ├── AdminUsers.jsx          # User management component
│   ├── AdminTenants.jsx        # Tenant management component
│   └── AdminActivityLogs.jsx   # Activity monitoring component
└── App.jsx                     # AdminRoute guard
```

### Backend Structure
```
backend/src/
├── controllers/
│   └── adminController.js      # Admin API logic
├── routes/
│   └── admin.routes.js         # Admin route definitions
└── middleware/
    └── auth.js                 # restrictTo('Admin') middleware
```

### Database Queries
- **Cross-tenant queries**: Admin can query users/documents across all tenants
- **Aggregation pipelines**: Used for statistics and growth charts
- **Population**: User data populated in activity logs
- **Indexing**: Efficient queries on tenantId, role, isActive fields

## Future Enhancements

### Planned Features
- [ ] Document management (view all documents across tenants)
- [ ] System health monitoring (CPU, memory, DB status)
- [ ] Email notifications to users
- [ ] Bulk user operations
- [ ] Export reports (CSV, PDF)
- [ ] Advanced analytics dashboards
- [ ] Audit trail exports
- [ ] Real-time activity feed
- [ ] User activity heatmaps
- [ ] Storage quotas per tenant

### Potential Improvements
- Search autocomplete for users
- Advanced filtering (date ranges, multiple tenants)
- Tenant-level settings management
- Custom admin roles (SuperAdmin, Moderator)
- API rate limit management
- Scheduled reports via email

## Security Considerations

1. **Authentication**: All admin routes require valid JWT token
2. **Authorization**: Only users with role "Admin" can access
3. **Activity Logging**: All admin actions logged for audit
4. **Confirmation Modals**: Prevent accidental destructive actions
5. **Reason Requirements**: Deactivations require documented reasons
6. **No Password Exposure**: Admin cannot see user passwords
7. **Tenant Isolation**: Admin can see all, but users remain isolated

## Support

For issues or questions:
1. Check backend logs: `cd backend && npm run dev`
2. Check browser console for frontend errors
3. Review MongoDB collections for data integrity
4. Verify environment variables are set correctly
5. Ensure all dependencies are installed

## Conclusion

The Admin Dashboard provides powerful tools for system oversight and user management. Use these capabilities responsibly to maintain a secure and well-functioning SaaS platform.
