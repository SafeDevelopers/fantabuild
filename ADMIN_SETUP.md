# Admin Dashboard Setup Guide

## Overview

The admin dashboard allows you to:
- View analytics and statistics
- Manage users (view, update roles, update subscriptions, delete)
- Manage creations (view, delete)
- Monitor system usage

## Access the Admin Dashboard

1. **Sign in** to your account
2. If your account has `admin` role, you'll see an **"Admin"** button in the top right
3. Click **"Admin"** or go to `/admin` in your browser
4. You'll see the admin dashboard

## Making Your First Admin User

### Option 1: Via Database (Recommended)

1. Connect to your PostgreSQL database:
   ```bash
   psql -h your-db-host -U fantabuild_user -d fantabuild
   ```

2. Find your user ID:
   ```sql
   SELECT id, email FROM users WHERE email = 'your-email@example.com';
   ```

3. Update your user to admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

4. Verify:
   ```sql
   SELECT email, role FROM users WHERE email = 'your-email@example.com';
   ```

### Option 2: Via Admin API (if you already have an admin)

1. Sign in as an existing admin
2. Go to `/admin`
3. Navigate to "Users" tab
4. Find the user you want to make admin
5. Change their role from "User" to "Admin" using the dropdown

## Admin Features

### Overview Tab
- **Total Users**: Count of all registered users
- **Pro Users**: Count of users with Pro subscription
- **Total Creations**: Count of all generated creations
- **Purchased Creations**: Count of creations that were purchased
- **Total Generations**: Sum of all daily usage counts
- **Last 7 Days**: New users and creations in the past week

### Users Tab
- View all users in a table
- **Update Role**: Change user between "User" and "Admin"
- **Update Subscription**: Change between "Free" and "Pro"
- **Delete User**: Remove a user (cannot delete yourself)
- See user stats: daily usage count, number of creations

### Creations Tab
- View all creations across all users
- See which user created each creation
- See creation mode (web/mobile/social/logo)
- See if creation was purchased
- **Delete Creation**: Remove a creation

## Security Notes

- ⚠️ **Admin access is restricted**: Only users with `role = 'admin'` can access
- ⚠️ **JWT tokens**: Admin status is checked on every API request
- ⚠️ **Cannot delete yourself**: Safety feature to prevent lockout
- ⚠️ **All actions logged**: Check server logs for admin actions

## API Endpoints

All admin endpoints require authentication and admin role:

- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/creations` - Get all creations (paginated)
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/subscription` - Update user subscription
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/creations/:id` - Delete creation

## Troubleshooting

### "Access Denied" error
- Your account doesn't have admin role
- Follow "Making Your First Admin User" above

### Can't see Admin button
- Check your user role in database: `SELECT role FROM users WHERE email = 'your-email';`
- Make sure it's set to `'admin'` (not `'user'`)
- Refresh the page after updating role

### Admin dashboard shows errors
- Check browser console (F12) for errors
- Verify backend is running and accessible
- Check that JWT token includes role information

## Best Practices

1. **Limit admin users**: Only give admin access to trusted users
2. **Use strong passwords**: Admin accounts should have strong passwords
3. **Monitor admin actions**: Check logs regularly for suspicious activity
4. **Backup before bulk operations**: Always backup database before deleting multiple users/creations

