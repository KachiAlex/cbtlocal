# CBT Hierarchical Admin System

## Overview
The CBT system now implements a hierarchical admin management system where only the default administrator can create and delete other admin users. This ensures proper access control and prevents unauthorized admin account management.

## System Architecture

### Admin Hierarchy Levels

1. **Default Administrator (Super Admin)**
   - Username: `admin`
   - Password: `admin123`
   - Full privileges including creating/deleting other admins
   - Cannot be deleted by other admins
   - Marked with `isDefaultAdmin: true`

2. **Regular Administrators**
   - Created by the default admin
   - Can manage exams, questions, and results
   - Cannot create or delete other admin accounts
   - Can be deleted by the default admin
   - Marked with `isDefaultAdmin: false`

## Database Schema Changes

### User Model Updates
```javascript
{
  username: String,
  email: String,
  password: String,
  role: String, // 'admin' or 'student'
  fullName: String,
  registeredAt: Date,
  createdAt: Date,
  updatedAt: Date,
  // New fields for admin hierarchy
  isDefaultAdmin: Boolean, // true for default admin, false for others
  createdBy: String, // username of admin who created this user
  canDeleteDefaultAdmin: Boolean // only default admin can delete others
}
```

## Backend API Endpoints

### 1. Initialize Default Admin
```
POST /api/init-admin
```
- Creates the default admin user only if no admin exists
- Returns admin details with `isDefaultAdmin: true`

### 2. Create New Admin (Default Admin Only)
```
POST /api/admin/create
```
**Request Body:**
```json
{
  "username": "newadmin",
  "password": "password123",
  "fullName": "New Administrator",
  "email": "newadmin@example.com",
  "requestingAdmin": "admin"
}
```
**Response:**
```json
{
  "message": "Admin user created successfully",
  "user": {
    "username": "newadmin",
    "role": "admin",
    "fullName": "New Administrator",
    "email": "newadmin@example.com",
    "isDefaultAdmin": false,
    "createdBy": "admin"
  }
}
```

### 3. List Admin Users (Default Admin Only)
```
GET /api/admin/list?requestingAdmin=admin
```
**Response:**
```json
[
  {
    "username": "admin",
    "fullName": "System Administrator",
    "email": "admin@healthschool.com",
    "isDefaultAdmin": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "username": "newadmin",
    "fullName": "New Administrator",
    "email": "newadmin@example.com",
    "isDefaultAdmin": false,
    "createdBy": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### 4. Delete Admin User (Default Admin Only)
```
DELETE /api/admin/{username}
```
**Request Body:**
```json
{
  "requestingAdmin": "admin"
}
```
**Response:**
```json
{
  "message": "Admin user deleted successfully",
  "deletedUser": {
    "username": "newadmin",
    "fullName": "New Administrator"
  }
}
```

## Frontend Implementation

### Admin Management UI
The admin management interface is located in the **Settings** tab of the admin panel and includes:

1. **Default Admin Dashboard**
   - Shows current admin status and privileges
   - Create new admin button
   - List of all admin users with delete options

2. **Regular Admin Dashboard**
   - Shows limited access message
   - No admin management capabilities

### Create Admin Modal
- Form validation for all fields
- Password confirmation
- Username uniqueness check
- Email format validation
- Prevents creation of username 'admin'

### Admin List Display
- Shows all admin users with their details
- Default admin is marked with a special badge
- Delete buttons only for non-default admins
- Shows who created each admin

## Security Features

### Access Control
- Only default admin can access admin management endpoints
- Regular admins cannot create or delete other admins
- Default admin cannot be deleted
- Username 'admin' is reserved for default administrator

### Validation
- All admin creation requests require valid credentials
- Username uniqueness is enforced
- Email format validation
- Password strength requirements (minimum 6 characters)

### Error Handling
- Proper error messages for unauthorized access
- Validation error responses
- Graceful fallback to localStorage when API is unavailable

## Usage Instructions

### For Default Administrator

1. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin123`

2. **Access Admin Management:**
   - Go to Settings tab in admin panel
   - Click "Create New Admin" button

3. **Create New Admin:**
   - Fill in all required fields
   - Ensure username is unique
   - Set strong password

4. **Manage Existing Admins:**
   - View all admin users in the list
   - Delete non-default admins as needed

### For Regular Administrators

1. **Login with credentials provided by default admin**
2. **Access limited admin panel:**
   - Can manage exams, questions, and results
   - Cannot access admin management features
   - See limited access message in Settings

## Testing

### Backend Testing
Run the test script to verify the system:
```bash
cd backend
node test-admin.js
```

This will:
- Test default admin creation
- Test authentication
- Test admin hierarchy functionality
- List all admin users
- Clean up test data

### Frontend Testing
1. Build the frontend: `npm run build`
2. Test admin login with default credentials
3. Test creating new admin users
4. Test admin deletion
5. Test regular admin access limitations

## Migration Notes

### Existing Systems
- Existing admin users will be preserved
- The first admin user found will be marked as default admin
- New hierarchy fields will be added to existing users

### Database Migration
- New fields are added with default values
- Existing admin users get `isDefaultAdmin: false` by default
- The first admin user should be manually updated to `isDefaultAdmin: true`

## Troubleshooting

### Common Issues

1. **"Only the default admin can create new admin users"**
   - Ensure you're logged in as the default admin (username: admin)
   - Check that the default admin has `isDefaultAdmin: true`

2. **"Cannot delete the default admin user"**
   - This is by design for security
   - Only the default admin can delete other admins

3. **"Username already exists"**
   - Choose a different username
   - Username 'admin' is reserved

4. **API connection issues**
   - System falls back to localStorage
   - Check backend server status
   - Verify API endpoints are accessible

### Debug Information
- Check browser console for detailed error messages
- Use the test script to verify backend functionality
- Monitor API responses for specific error details

## Future Enhancements

### Potential Improvements
1. **Admin Role Levels**: Different permission levels for admins
2. **Admin Activity Logging**: Track admin actions and changes
3. **Admin Password Reset**: Allow default admin to reset other admin passwords
4. **Admin Session Management**: Track and manage admin sessions
5. **Two-Factor Authentication**: Enhanced security for admin accounts

### Security Considerations
- Regular password updates for admin accounts
- Monitor admin activity for suspicious behavior
- Backup admin account information
- Consider implementing admin account expiration 