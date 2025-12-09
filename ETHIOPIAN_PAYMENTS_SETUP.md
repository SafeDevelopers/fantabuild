# Ethiopian Payment Methods Setup

This guide explains how to set up TeleBirr, CBE, and other Ethiopian payment methods for Fanta Build.

## Overview

Fanta Build now supports multiple payment gateways:
- **Stripe** - International credit/debit cards (USD)
- **TeleBirr** - Mobile money (ETB)
- **CBE** - Commercial Bank of Ethiopia (ETB)

## Setup Steps

### 1. Database Migration

Run the payment sessions table migration:

```bash
psql -U postgres -d fantabuild -f database/payment-sessions.sql
```

### 2. Environment Variables

Add these to your `server/.env` file in CapRover:

#### TeleBirr Configuration
```env
# TeleBirr API Credentials (Contact Ethio Telecom)
TELEBIRR_APP_ID=your_app_id
TELEBIRR_APP_KEY=your_app_key
TELEBIRR_SHORT_CODE=your_short_code
TELEBIRR_API_URL=https://api.telebirr.et
TELEBIRR_PUBLIC_KEY=your_public_key_for_decryption
```

#### CBE Configuration
```env
# CBE Payment Gateway (Contact CBE)
CBE_MERCHANT_ID=your_merchant_id
CBE_MERCHANT_KEY=your_merchant_key
CBE_API_URL=https://payment.cbe.com.et/api
```

#### Stripe (Optional - for international users)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Getting API Credentials

#### TeleBirr
1. Contact Ethio Telecom to request TeleBirr API access
2. Provide business documentation for verification
3. Receive `app_id`, `app_key`, `short_code`, and public key
4. Set up callback URLs in your TeleBirr dashboard

#### CBE
1. Contact Commercial Bank of Ethiopia for payment gateway access
2. Complete merchant application
3. Receive `merchant_id` and `merchant_key`
4. Set up callback URLs in CBE payment portal

### 4. Payment Flow

#### For Users:
1. User generates content
2. After free trials, user clicks to purchase
3. Payment modal shows available payment methods:
   - Stripe (Credit/Debit Card) - $3.99 USD
   - TeleBirr (Mobile Money) - ~220 ETB
   - CBE (Bank Transfer) - ~220 ETB
4. User selects payment method
5. Redirects to payment gateway
6. After payment, callback updates database
7. User is redirected back with download access

### 5. Currency Conversion

The system automatically converts USD to ETB:
- $3.99 ≈ 220 ETB (adjust rate in `payment-gateways.js`)
- $25 ≈ 1,400 ETB (adjust rate in `payment-gateways.js`)

Update conversion rate in `server/payment-gateways.js`:
```javascript
const amountInETB = currency === 'USD' 
  ? Math.round(amount * 55) // Update this rate
  : amount;
```

### 6. Callback URLs

Set these callback URLs in your payment gateway dashboards:

**TeleBirr:**
```
https://api.yourdomain.com/api/payment/telebirr/callback
```

**CBE:**
```
https://api.yourdomain.com/api/payment/cbe/callback
```

### 7. Testing

1. Use sandbox/test credentials from TeleBirr/CBE
2. Test payment flow end-to-end
3. Verify callbacks are received
4. Check database updates correctly

## API Endpoints

### Get Available Payment Gateways
```
GET /api/payment/gateways
```

### Create Payment Session
```
POST /api/payment/create
Body: {
  gateway: 'telebirr' | 'cbe' | 'stripe',
  amount: 3.99,
  currency: 'USD' | 'ETB',
  creationId: 'uuid',
  type: 'onetime' | 'subscription',
  phone: '+251...' // Optional for TeleBirr
}
```

### Payment Callbacks
```
POST /api/payment/telebirr/callback
POST /api/payment/cbe/callback
```

## Frontend Integration

The frontend automatically:
1. Fetches available payment gateways
2. Shows payment method selection in purchase modal
3. Creates payment session based on selected gateway
4. Redirects user to payment gateway
5. Handles payment success callback

## Troubleshooting

### Payment not processing
- Check API credentials are correct
- Verify callback URLs are accessible
- Check server logs for errors
- Ensure database migration ran successfully

### Callback not received
- Verify callback URL is correct in gateway dashboard
- Check server is accessible from internet
- Verify webhook/callback endpoint is working

### Currency conversion issues
- Update conversion rate in `payment-gateways.js`
- Check current USD/ETB exchange rate
- Adjust amounts accordingly

## Support

For payment gateway issues:
- **TeleBirr**: Contact Ethio Telecom support
- **CBE**: Contact CBE merchant services
- **Stripe**: Check Stripe dashboard and logs

## Notes

- Payment sessions are stored in database for tracking
- Failed payments can be retried
- All payment methods support both one-time and subscription payments
- Ethiopian payment methods use ETB currency
- Stripe uses USD currency
