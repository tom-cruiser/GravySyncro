# Profile API Testing Guide

## Testing with curl (from terminal)

### 1. Register a Test User (if needed)
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser@example.com",
    "password": "Test123456",
    "role": "Professional"
  }'
```

### 2. Login to Get Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123456"
  }'
```

**Save the token from the response!**

### 3. Get Current Profile
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update Profile
```bash
curl -X PATCH http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+1 234 567 8900",
    "organization": "My Company"
  }'
```

### 5. Change Password
```bash
curl -X PATCH http://localhost:5000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test123456",
    "newPassword": "NewTest123456"
  }'
```

## Testing with Postman/Thunder Client

### Setup
1. Create a new collection called "Profile Tests"
2. Add an environment variable `token` to store your JWT
3. Add an environment variable `baseUrl` = `http://localhost:5000/api/v1`

### Test Cases

#### TC1: Update Profile - Success
- **Method**: PATCH
- **URL**: `{{baseUrl}}/users/profile`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1 555 123 4567",
  "organization": "Acme Corp"
}
```
- **Expected**: 200 OK, updated user object

#### TC2: Update Profile - Missing Fields (Should Still Work)
- **Method**: PATCH
- **URL**: `{{baseUrl}}/users/profile`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "firstName": "Jane"
}
```
- **Expected**: 200 OK, only firstName updated

#### TC3: Update Profile - Invalid Token
- **Method**: PATCH
- **URL**: `{{baseUrl}}/users/profile`
- **Headers**: 
  - `Authorization: Bearer invalid_token`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "firstName": "Test"
}
```
- **Expected**: 401 Unauthorized

#### TC4: Update Profile - Try to Change Email (Should Fail)
- **Method**: PATCH
- **URL**: `{{baseUrl}}/users/profile`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "email": "newemail@example.com"
}
```
- **Expected**: 400 Bad Request (email cannot be changed here)

#### TC5: Change Password - Success
- **Method**: PATCH
- **URL**: `{{baseUrl}}/auth/change-password`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "currentPassword": "Test123456",
  "newPassword": "NewTest123456"
}
```
- **Expected**: 200 OK, new token issued

#### TC6: Change Password - Wrong Current Password
- **Method**: PATCH
- **URL**: `{{baseUrl}}/auth/change-password`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "currentPassword": "WrongPassword",
  "newPassword": "NewTest123456"
}
```
- **Expected**: 401 Unauthorized

#### TC7: Change Password - Weak Password
- **Method**: PATCH
- **URL**: `{{baseUrl}}/auth/change-password`
- **Headers**: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "currentPassword": "Test123456",
  "newPassword": "weak"
}
```
- **Expected**: 400 Bad Request (validation error)

## Frontend Testing Checklist

### Profile Tab
- [ ] Form loads with current user data
- [ ] Can edit first name
- [ ] Can edit last name
- [ ] Can add/edit phone number
- [ ] Can add/edit organization
- [ ] Email field is disabled (grayed out)
- [ ] Role is displayed but not editable
- [ ] Account status shows correct verification status
- [ ] Member since date is displayed
- [ ] Save button shows "Saving..." during request
- [ ] Success message appears after successful save
- [ ] Error message appears if save fails
- [ ] Redux state updates after successful save
- [ ] Data persists after page refresh

### Security Tab
- [ ] Can enter current password
- [ ] Can enter new password
- [ ] Can confirm new password
- [ ] Password requirements are shown
- [ ] Error if passwords don't match
- [ ] Error if password too short
- [ ] Error if password doesn't meet complexity requirements
- [ ] Update button shows "Updating..." during request
- [ ] Success message appears after successful update
- [ ] Password fields clear after successful update
- [ ] Error message if current password is wrong
- [ ] 2FA section shows current status (enabled/disabled)

## Expected API Responses

### Successful Profile Update
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "testuser@example.com",
      "phone": "+1 555 123 4567",
      "organization": "Acme Corp",
      "role": "Professional",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-20T15:30:00.000Z"
    }
  }
}
```

### Successful Password Change
```json
{
  "status": "success",
  "token": "new_jwt_token_here",
  "refreshToken": "new_refresh_token_here",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "testuser@example.com",
      "role": "Professional"
    }
  }
}
```

### Error Response Example
```json
{
  "status": "error",
  "message": "Current password is incorrect"
}
```

## Manual Browser Testing Flow

1. **Start Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend  
   npm run dev
   ```

2. **Login**
   - Go to http://localhost:3000
   - Login with test credentials
   - Navigate to Profile page

3. **Test Profile Update**
   - Change first name to "TestUser"
   - Add phone: "+1 555 123 4567"
   - Add organization: "Test Corp"
   - Click "Save Changes"
   - Verify success message
   - Refresh page - data should persist

4. **Test Password Change**
   - Click "Security" tab
   - Enter current password
   - Enter new password: "NewTest123456"
   - Confirm password: "NewTest123456"
   - Click "Update Password"
   - Verify success message
   - Verify password fields cleared
   - Logout and login with new password

5. **Test Error Scenarios**
   - Try to change password with wrong current password
   - Try password that's too short
   - Try password without uppercase/lowercase/number
   - Try mismatched password confirmation

## Browser DevTools Inspection

### Network Tab
- Check API calls are made to correct endpoints
- Verify Authorization header is present
- Check response status codes (200, 400, 401, etc.)
- Inspect request/response payloads

### Console Tab
- Should be no JavaScript errors
- Look for any API error logs
- Check Redux state updates

### Application/Storage Tab
- Verify token is stored properly
- Check if user data is in localStorage/sessionStorage (if applicable)

## Performance Testing
- Profile update should complete in < 1 second
- Password change should complete in < 2 seconds (bcrypt hashing)
- No memory leaks when navigating between tabs
- Form should remain responsive during API calls

## Security Testing
- [ ] Cannot access profile without valid token
- [ ] Cannot change another user's profile
- [ ] Password is never visible in network requests
- [ ] Old password is required to change password
- [ ] JWT token has reasonable expiration
- [ ] Sensitive data not logged to console

## Common Issues & Solutions

### Issue: "Network Error"
- **Check**: Is backend running on port 5000?
- **Check**: Is CORS configured correctly?
- **Check**: Is `.env` file configured?

### Issue: "Unauthorized"
- **Check**: Is user logged in?
- **Check**: Is token valid and not expired?
- **Check**: Is Authorization header formatted correctly?

### Issue: "Validation Error"
- **Check**: Are all required fields provided?
- **Check**: Do values meet validation requirements?
- **Check**: Is phone/organization allowed to be empty?

### Issue: Profile data doesn't persist
- **Check**: Is MongoDB running?
- **Check**: Is save operation returning success?
- **Check**: Is Redux state being updated?

## Success Criteria ✅

- [x] Profile updates save to database
- [x] Password change works with proper validation
- [x] Error handling is user-friendly
- [x] Loading states prevent duplicate submissions
- [x] Success/error messages are clear
- [x] Redux state updates correctly
- [x] Data persists across page reloads
- [x] Security: proper authentication required
- [x] Validation: both client and server side
- [x] UI: responsive and accessible
