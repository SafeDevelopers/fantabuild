# Permanent Admin Account

Fanta Build includes a permanent admin account that is always available for administrative access.

## Default Credentials

- **Email:** `admin@fantabuild.com`
- **Password:** Adimin1971@``

## Configuration

These credentials are stored in the backend `.env` file:

```env
ADMIN_EMAIL=admin@fantabuild.com
ADMIN_PASSWORD=Adimin1971@
```

## How It Works

1. **Automatic Creation:** On server start, the system automatically:
   - Checks if the admin account exists in the database
   - Creates it if it doesn't exist
   - Updates it to ensure it has `admin` role and `pro` subscription

2. **Login Process:** When logging in with the admin credentials:
   - The system checks against `.env` values first
   - If credentials match, it authenticates as admin
   - Returns admin role and pro subscription status

3. **Always Available:** This account:
   - Cannot be deleted
   - Always has admin privileges
   - Always has pro subscription
   - Works even if database is reset

## Changing Credentials

To change the admin credentials:

1. Update `server/.env` file:
   ```env
   ADMIN_EMAIL=your-new-admin@email.com
   ADMIN_PASSWORD=YourNewPassword123!
   ```

2. Restart the server

3. The new credentials will be used for authentication

## Security Notes

⚠️ **Important Security Considerations:**

- Keep the `.env` file secure and never commit it to git
- Use a strong password for production
- Consider changing the default password
- The admin account bypasses normal password hashing (uses direct comparison)
- This is intentional for emergency access, but keep credentials secure

## Usage

Simply log in with the admin credentials through the normal login flow:

1. Go to the login page
2. Enter: `admin@fantabuild.com`
3. Enter: `Adimin1971@`
4. You'll be logged in as admin with full access

## CapRover Setup

In CapRover, add these environment variables:

1. Go to your app in CapRover dashboard
2. Click "App Configs" > "Environment Variables"
3. Add:
   ```
   ADMIN_EMAIL=admin@fantabuild.com
   ADMIN_PASSWORD=Adimin1971@
   ```
4. Click "Save & Update"

The admin account will be automatically available after deployment.
