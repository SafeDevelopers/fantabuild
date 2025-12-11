/**
 * Payment Gateway Abstraction Layer
 * Supports multiple payment methods: Stripe, TeleBirr, CBE, etc.
 */
import crypto from 'crypto';

/**
 * Payment Gateway Types
 */
const PAYMENT_GATEWAYS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  TELEBIRR: 'telebirr',
  CBE: 'cbe',
  M_PESA: 'mpesa', // If available in Ethiopia
  AMOLE: 'amole', // Another Ethiopian payment method
};

/**
 * Initialize TeleBirr Payment Gateway
 */
async function initTeleBirrPayment(amount, currency, orderId, customerInfo) {
  // TeleBirr API integration
  // You'll need to get these from Ethio Telecom
  const TELEBIRR_APP_ID = process.env.TELEBIRR_APP_ID;
  const TELEBIRR_APP_KEY = process.env.TELEBIRR_APP_KEY;
  const TELEBIRR_SHORT_CODE = process.env.TELEBIRR_SHORT_CODE;
  const TELEBIRR_API_URL = process.env.TELEBIRR_API_URL || 'https://api.telebirr.et';

  if (!TELEBIRR_APP_ID || !TELEBIRR_APP_KEY) {
    throw new Error('TeleBirr API credentials not configured');
  }

  // Convert amount to ETB (Ethiopian Birr)
  // Assuming $3.99 = ~220 ETB, $25 = ~1400 ETB (adjust based on current rate)
  const amountInETB = currency === 'USD' 
    ? Math.round(amount * 55) // Approximate conversion rate
    : amount;

  // Prepare request parameters
  const params = {
    appId: TELEBIRR_APP_ID,
    appKey: TELEBIRR_APP_KEY,
    shortCode: TELEBIRR_SHORT_CODE,
    outTradeNo: orderId,
    subject: 'Fanta Build Purchase',
    totalAmount: amountInETB.toString(),
    notifyUrl: `${process.env.FRONTEND_URL || 'https://fantabuild.addispos.com'}/api/payment/telebirr/callback`,
    returnUrl: `${process.env.FRONTEND_URL || 'https://fantabuild.addispos.com'}/payment-success?gateway=telebirr&order_id=${orderId}`,
    receiveName: 'Fanta Build',
    timeoutExpress: '30m',
  };

  // Create request string for hash
  const requestString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Generate SHA256 hash
  const hash = crypto.createHash('sha256').update(requestString).digest('hex');

  // Encrypt data using RSA (simplified - you'll need proper RSA encryption)
  // For now, we'll send the data as JSON
  const payload = {
    appid: TELEBIRR_APP_ID,
    data: JSON.stringify(params),
    hash: hash,
  };

  try {
    const response = await fetch(`${TELEBIRR_API_URL}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.code === '0000' && data.toPayURL) {
      return {
        success: true,
        paymentUrl: data.toPayURL,
        gateway: PAYMENT_GATEWAYS.TELEBIRR,
        orderId: orderId,
      };
    } else {
      throw new Error(data.message || 'Failed to create TeleBirr payment');
    }
  } catch (error) {
    console.error('TeleBirr payment error:', error);
    throw new Error(`TeleBirr payment failed: ${error.message}`);
  }
}

/**
 * Initialize CBE Payment Gateway
 */
async function initCBEPayment(amount, currency, orderId, customerInfo) {
  // CBE Payment Gateway integration
  // You'll need to contact CBE for API credentials
  const CBE_MERCHANT_ID = process.env.CBE_MERCHANT_ID;
  const CBE_MERCHANT_KEY = process.env.CBE_MERCHANT_KEY;
  const CBE_API_URL = process.env.CBE_API_URL || 'https://payment.cbe.com.et/api';

  if (!CBE_MERCHANT_ID || !CBE_MERCHANT_KEY) {
    throw new Error('CBE payment credentials not configured');
  }

  // Convert amount to ETB
  const amountInETB = currency === 'USD' 
    ? Math.round(amount * 55) 
    : amount;

  const params = {
    merchantId: CBE_MERCHANT_ID,
    orderId: orderId,
    amount: amountInETB,
    currency: 'ETB',
    description: 'Fanta Build Purchase',
    customerEmail: customerInfo.email,
    customerPhone: customerInfo.phone || '',
    returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?gateway=cbe&order_id=${orderId}`,
    notifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/payment/cbe/callback`,
  };

  // Generate signature (CBE specific algorithm)
  const signatureString = `${CBE_MERCHANT_ID}${orderId}${amountInETB}${CBE_MERCHANT_KEY}`;
  const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

  try {
    const response = await fetch(`${CBE_API_URL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CBE_MERCHANT_KEY}`,
      },
      body: JSON.stringify({
        ...params,
        signature: signature,
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.paymentUrl) {
      return {
        success: true,
        paymentUrl: data.paymentUrl,
        gateway: PAYMENT_GATEWAYS.CBE,
        orderId: orderId,
      };
    } else {
      throw new Error(data.message || 'Failed to create CBE payment');
    }
  } catch (error) {
    console.error('CBE payment error:', error);
    throw new Error(`CBE payment failed: ${error.message}`);
  }
}

/**
 * Initialize PayPal Payment Gateway
 */
async function initPayPalPayment(amount, currency, orderId, customerInfo) {
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'
  const PAYPAL_BASE_URL = PAYPAL_MODE === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal API credentials not configured');
  }

  try {
    // Step 1: Get PayPal access token
    const authString = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const authResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Step 2: Create PayPal order
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          description: 'Fanta Build Purchase',
          amount: {
            currency_code: currency || 'USD',
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Fanta Build',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${frontendUrl}/payment-success?gateway=paypal&order_id=${orderId}`,
        cancel_url: `${frontendUrl}/payment-cancel`,
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      },
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': orderId,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.message || 'Failed to create PayPal order');
    }

    const orderData = await orderResponse.json();

    // Find approval URL from links
    const approvalLink = orderData.links?.find(link => link.rel === 'approve');
    if (!approvalLink || !approvalLink.href) {
      throw new Error('PayPal approval URL not found');
    }

    return {
      success: true,
      paymentUrl: approvalLink.href,
      gateway: PAYMENT_GATEWAYS.PAYPAL,
      orderId: orderData.id, // PayPal order ID
      referenceId: orderId, // Our internal order ID
    };
  } catch (error) {
    console.error('PayPal payment error:', error);
    throw new Error(`PayPal payment failed: ${error.message}`);
  }
}

/**
 * Verify PayPal payment callback
 */
async function verifyPayPalCallback(callbackData) {
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
  const PAYPAL_BASE_URL = PAYPAL_MODE === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    // Get access token
    const authString = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const authResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      return { success: false, error: 'Failed to authenticate with PayPal' };
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify the order
    const orderId = callbackData.orderID || callbackData.order_id;
    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!verifyResponse.ok) {
      return { success: false, error: 'Failed to verify PayPal order' };
    }

    const orderData = await verifyResponse.json();

    // If order is approved but not captured, capture it
    if (orderData.status === 'APPROVED') {
      const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!captureResponse.ok) {
        return { success: false, error: 'Failed to capture PayPal order' };
      }

      const captureData = await captureResponse.json();
      const purchaseUnit = captureData.purchase_units?.[0];
      const payment = purchaseUnit?.payments?.captures?.[0];

      return {
        success: true,
        transactionId: payment?.id || orderId,
        orderId: purchaseUnit?.reference_id || orderId,
        amount: parseFloat(purchaseUnit?.amount?.value || '0'),
        gateway: PAYMENT_GATEWAYS.PAYPAL,
      };
    }

    // Check if order is already completed
    if (orderData.status === 'COMPLETED') {
      // Get payment details
      const purchaseUnit = orderData.purchase_units?.[0];
      const payment = purchaseUnit?.payments?.captures?.[0] || purchaseUnit?.payments?.authorizations?.[0];

      return {
        success: true,
        transactionId: payment?.id || orderId,
        orderId: purchaseUnit?.reference_id || orderId,
        amount: parseFloat(purchaseUnit?.amount?.value || '0'),
        gateway: PAYMENT_GATEWAYS.PAYPAL,
      };
    }

    return {
      success: false,
      error: `Order status: ${orderData.status}`,
    };
  } catch (error) {
    console.error('PayPal callback verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create payment session based on gateway
 */
async function createPaymentSession(gateway, amount, currency, orderId, customerInfo, metadata = {}) {
  switch (gateway) {
    case PAYMENT_GATEWAYS.PAYPAL:
      return await initPayPalPayment(amount, currency, orderId, customerInfo);
    
    case PAYMENT_GATEWAYS.TELEBIRR:
      return await initTeleBirrPayment(amount, currency, orderId, customerInfo);
    
    case PAYMENT_GATEWAYS.CBE:
      return await initCBEPayment(amount, currency, orderId, customerInfo);
    
    case PAYMENT_GATEWAYS.STRIPE:
      // Stripe is handled separately in server.js
      throw new Error('Use Stripe endpoints directly');
    
    default:
      throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
}

/**
 * Verify payment callback from gateway
 */
async function verifyPaymentCallback(gateway, callbackData) {
  switch (gateway) {
    case PAYMENT_GATEWAYS.PAYPAL:
      return await verifyPayPalCallback(callbackData);
    
    case PAYMENT_GATEWAYS.TELEBIRR:
      return await verifyTeleBirrCallback(callbackData);
    
    case PAYMENT_GATEWAYS.CBE:
      return await verifyCBECallback(callbackData);
    
    default:
      throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
}

/**
 * Verify TeleBirr payment callback
 */
async function verifyTeleBirrCallback(callbackData) {
  const TELEBIRR_PUBLIC_KEY = process.env.TELEBIRR_PUBLIC_KEY;
  
  // Decrypt and verify the callback data
  // TeleBirr sends encrypted notifications
  // You'll need to decrypt using the public key provided by TeleBirr
  
  // This is a simplified version - implement proper decryption
  try {
    // Decrypt the data (implement RSA decryption)
    // For now, assuming callbackData contains decrypted transaction info
    const transaction = {
      transactionNo: callbackData.transactionNo,
      outTradeNo: callbackData.outTradeNo,
      totalAmount: callbackData.totalAmount,
      tradeDate: callbackData.tradeDate,
      status: callbackData.status,
    };

    return {
      success: transaction.status === 'SUCCESS',
      transactionId: transaction.transactionNo,
      orderId: transaction.outTradeNo,
      amount: transaction.totalAmount,
      gateway: PAYMENT_GATEWAYS.TELEBIRR,
    };
  } catch (error) {
    console.error('TeleBirr callback verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify CBE payment callback
 */
async function verifyCBECallback(callbackData) {
  const CBE_MERCHANT_KEY = process.env.CBE_MERCHANT_KEY;
  
  try {
    // Verify signature
    const signatureString = `${callbackData.merchantId}${callbackData.orderId}${callbackData.amount}${CBE_MERCHANT_KEY}`;
    const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');
    
    if (callbackData.signature !== expectedSignature) {
      return { success: false, error: 'Invalid signature' };
    }

    return {
      success: callbackData.status === 'SUCCESS',
      transactionId: callbackData.transactionId,
      orderId: callbackData.orderId,
      amount: callbackData.amount,
      gateway: PAYMENT_GATEWAYS.CBE,
    };
  } catch (error) {
    console.error('CBE callback verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get available payment gateways based on configuration
 */
function getAvailableGateways() {
  const gateways = [];
  
  if (process.env.STRIPE_SECRET_KEY) {
    gateways.push({
      id: PAYMENT_GATEWAYS.STRIPE,
      name: 'Stripe',
      description: 'Credit/Debit Card (International)',
      icon: '💳',
      currency: 'USD',
    });
  }
  
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    gateways.push({
      id: PAYMENT_GATEWAYS.PAYPAL,
      name: 'PayPal',
      description: 'Pay with PayPal Account',
      icon: '🅿️',
      currency: 'USD',
    });
  }
  
  if (process.env.TELEBIRR_APP_ID && process.env.TELEBIRR_APP_KEY) {
    gateways.push({
      id: PAYMENT_GATEWAYS.TELEBIRR,
      name: 'TeleBirr',
      description: 'Mobile Money (Ethiopia)',
      icon: '📱',
      currency: 'ETB',
    });
  }
  
  if (process.env.CBE_MERCHANT_ID && process.env.CBE_MERCHANT_KEY) {
    gateways.push({
      id: PAYMENT_GATEWAYS.CBE,
      name: 'CBE',
      description: 'Commercial Bank of Ethiopia',
      icon: '🏦',
      currency: 'ETB',
    });
  }
  
  return gateways;
}

export {
  PAYMENT_GATEWAYS,
  createPaymentSession,
  verifyPaymentCallback,
  getAvailableGateways,
};
