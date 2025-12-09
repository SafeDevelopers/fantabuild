# PayPal Payment Setup Guide

This guide explains how to set up PayPal payments for Fanta Build.

## Overview

PayPal integration allows users to pay using their PayPal account or credit/debit cards through PayPal. This is useful for international customers who prefer PayPal over Stripe.

## Prerequisites

1. A PayPal Business account
2. Access to PayPal Developer Dashboard
3. PayPal API credentials (Client ID and Secret)

## Setup Steps

### 1. Create PayPal App

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal Business account (or create one)
3. Navigate to **Dashboard** > **My Apps & Credentials**
4. Click **Create App**
5. Fill in:
   - **App Name**: Fanta Build
   - **Merchant**: Select your business account
   - **Features**: Select "Accept Payments"
6. Click **Create App**

### 2. Get API Credentials

After creating the app, you'll see:
- **Client ID**: Starts with `Ae...` or `Ab...`
- **Client Secret**: Click "Show" to reveal

**For Testing (Sandbox):**
- Use the **Sandbox** credentials (default)
- Test with PayPal sandbox accounts

**For Production (Live):**
- Switch to **Live** mode
- Use the **Live** credentials
- These are real payment credentials

### 3. Configure Environment Variables

Add these to your `server/.env` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox  # Use 'sandbox' for testing, 'live' for production
```

**For the account fmcell16@gmail.com:**
- Use the Client ID and Secret from the PayPal app you created
- Set `PAYPAL_MODE=sandbox` for testing
- Set `PAYPAL_MODE=live` for production

### 4. CapRover Setup

1. Go to your CapRover app dashboard
2. Navigate to **App Configs** > **Environment Variables**
3. Add:
   ```
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_MODE=live  # or 'sandbox' for testing
   ```
4. Click **Save & Update**

## Testing

### Sandbox Testing

1. Set `PAYPAL_MODE=sandbox` in your `.env`
2. Use PayPal sandbox test accounts:
   - Go to [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)
   - Create test personal and business accounts
   - Use these accounts to test payments

### Test Flow

1. User selects PayPal as payment method
2. User is redirected to PayPal login
3. User logs in with PayPal account
4. User approves payment
5. User is redirected back to your site
6. Payment is verified and processed

## Payment Flow

1. **User initiates payment** → Frontend calls `/api/payment/create` with `gateway: 'paypal'`
2. **Backend creates PayPal order** → Returns PayPal approval URL
3. **User redirected to PayPal** → User logs in and approves payment
4. **PayPal redirects back** → User returns to `/payment-success?gateway=paypal&order_id=...`
5. **Backend verifies payment** → PayPal callback endpoint verifies the order
6. **Payment processed** → Creation marked as purchased or user upgraded to Pro

## Supported Payment Types

- ✅ **One-time purchases** ($3.99 per download)
- ✅ **Subscriptions** ($25/month Pro subscription)

## Currency

PayPal payments are processed in **USD** by default. The system will:
- Convert amounts to USD if needed
- Display prices in USD for PayPal payments

## Webhook Setup (Optional)

For more reliable payment verification, you can set up PayPal webhooks:

1. In PayPal Developer Dashboard, go to your app
2. Navigate to **Webhooks**
3. Add webhook URL: `https://your-domain.com/api/payment/paypal/callback`
4. Select events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
5. Save webhook

The current implementation uses redirect-based verification, which works for most cases.

## Troubleshooting

### "PayPal API credentials not configured"
- Check that `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set in `.env`
- Restart the server after adding credentials

### "Failed to create PayPal order"
- Verify your Client ID and Secret are correct
- Check that `PAYPAL_MODE` matches your credentials (sandbox vs live)
- Check PayPal Developer Dashboard for API status

### Payment not completing
- Check server logs for PayPal API errors
- Verify callback URL is accessible
- Ensure `FRONTEND_URL` is set correctly in `.env`

### Sandbox vs Live Mode
- **Sandbox**: Use for testing, no real money
- **Live**: Use for production, real payments
- Make sure credentials match the mode you're using

## Security Notes

⚠️ **Important:**
- Never commit PayPal credentials to git
- Use different credentials for sandbox and live
- Keep Client Secret secure
- Use HTTPS in production
- Verify webhook signatures in production (future enhancement)

## Support

For PayPal API issues:
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Support](https://www.paypal.com/support)

For Fanta Build integration issues:
- Check server logs
- Verify environment variables
- Test with sandbox mode first

