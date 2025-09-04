# CBT Admin Login Troubleshooting Guide

## Issue Description
The admin login was not working due to missing authentication endpoints and improper error handling.

## Root Causes Identified
1. **Missing Authentication Endpoint**: Backend lacked `/api/auth/login` endpoint
2. **No Admin User Creation**: System didn't automatically create admin user in database
3. **Poor Error Handling**: Limited debugging information for connection issues
4. **Message Channel Errors**: Asynchronous response handling issues

## Fixes Applied

### 1. Backend Fixes (`server.js`)
- ✅ Added `/api/auth/login` endpoint for user authentication
- ✅ Added `/api/init-admin` endpoint for automatic admin user creation
- ✅ Improved error handling and response formatting

### 2. Frontend Fixes (`dataService.js`)
- ✅ Enhanced `authenticateUser` function with API-first approach
- ✅ Added localStorage fallback when API is unavailable
- ✅ Improved error logging and debugging information
- ✅ Added connection status checking

### 3. UI Improvements (`App.js`)
- ✅ Added loading states to admin login form
- ✅ Enhanced error messages and debugging
- ✅ Added connection status checking on app startup

## Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`
- **Full Name**: `System Administrator`
- **Email**: `admin@healthschool.com`

## How to Access Admin Panel

### Method 1: Click Logo
1. Go to the login page
2. Click on the logo (College of Nursing, Eku)
3. Admin login form will appear

### Method 2: Keyboard Shortcut
1. Go to the login page
2. Press `Ctrl + Alt + A`
3. Admin access link will appear for 5 seconds

## Testing the Fix

### 1. Test Backend
```bash
cd backend
node test-admin.js
```

### 2. Test Frontend
1. Open browser console
2. Navigate to the app
3. Check for connection status logs
4. Try admin login with credentials above

### 3. Check Console Logs
Look for these messages:
- ✅ `API connection successful`
- ✅ `User authenticated via API` or `User authenticated via localStorage`
- ✅ `Admin login successful`

## Common Issues and Solutions

### Issue: "API call failed, falling back to localStorage"
**Solution**: Check if backend server is running and accessible

### Issue: "Invalid admin credentials"
**Solution**: 
1. Run `node test-admin.js` to create admin user
2. Clear browser localStorage and try again

### Issue: "Message channel closed" error
**Solution**: 
1. Clear browser cache and localStorage
2. Refresh the page
3. Check if service workers are interfering

### Issue: Connection timeout
**Solution**:
1. Check network connectivity
2. Verify API_BASE_URL in environment
3. Ensure backend server is running

## Environment Variables
Make sure these are set correctly:
- `REACT_APP_USE_API=true` (for production)
- `REACT_APP_API_URL=https://your-backend-url.com`
- `MONGODB_URI=your-mongodb-connection-string`

## Debugging Steps
1. Open browser developer tools
2. Check Console tab for error messages
3. Check Network tab for failed API calls
4. Check Application tab for localStorage data
5. Run the test script to verify backend setup

## Support
If issues persist:
1. Check the console logs for specific error messages
2. Verify backend server is running and accessible
3. Test with the provided test script
4. Clear browser cache and localStorage 