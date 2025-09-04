# JWT Secret Key Setup

This document explains how to set up the JWT Secret Key for your CBT backend application.

## What is JWT Secret Key?

The JWT Secret Key is used to sign and verify JSON Web Tokens (JWTs) for user authentication. It should be a strong, random string that is kept secret.

## Setup Options

### Option 1: Vercel Environment Variables (Recommended for Production)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your CBT backend project
3. Navigate to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name:** `JWT_SECRET`
   - **Value:** Generate a strong random string (see below for examples)
   - **Environment:** Production (and optionally Preview/Development)
5. Click **Save**

### Option 2: Local Development (.env file)

1. Create a `.env` file in the root of your backend directory
2. Add the following line:
   ```
   JWT_SECRET=your_super_secret_jwt_key_here
   ```
3. Make sure `.env` is in your `.gitignore` file to keep it out of version control

### Option 3: Using vercel.json (Already configured)

The `vercel.json` file has been updated to include JWT_SECRET as an environment variable reference.

## Generating a Strong JWT Secret

You can generate a strong JWT secret using any of these methods:

### Method 1: Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Method 2: Online Generator
Use a secure online generator like:
- https://generate-secret.vercel.app/64
- https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

### Method 3: Manual (Less Secure)
Create a long, random string with mixed characters:
```
JWT_SECRET=my-super-secret-jwt-key-2024-cbt-application-very-long-and-random
```

## Example JWT Secret
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

## Security Best Practices

1. **Never commit your JWT secret to version control**
2. **Use different secrets for different environments** (development, staging, production)
3. **Make your secret at least 32 characters long**
4. **Use truly random characters** (letters, numbers, symbols)
5. **Rotate your secrets periodically** in production
6. **Keep your secrets secure** and limit access to them

## Usage in Code

The JWT configuration is set up in `src/config/jwt.js` and can be used like this:

```javascript
const { generateToken, authenticateToken } = require('./config/jwt');

// Generate a token
const token = generateToken({ userId: user.id, email: user.email });

// Protect routes
app.get('/protected', authenticateToken, (req, res) => {
  // req.user contains the decoded token payload
  res.json({ message: 'Protected data', user: req.user });
});
```

## Troubleshooting

- **"JWT_SECRET is not defined"**: Make sure you've set the environment variable correctly
- **"Invalid token"**: Check that your JWT_SECRET is the same across all environments
- **Token expiration**: Adjust `JWT_EXPIRES_IN` in the environment variables if needed (default: 24h) 