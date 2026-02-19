/**
 * HexAI WiFi Hotspot Payment Backend Server
 * LE.SS - Gambia Market
 * 
 * This server handles secure communication with the HexAI Payment Gateway API
 * for Wave Mobile Money payments.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Define an Express Router for all API endpoints
const apiRouter = express.Router();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://hpg-backend-6kzwb.ondigitalocean.app/api/v1';
const API_KEY = process.env.API_KEY || 'hexai_pba1qb16rxe';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const CURRENCY = process.env.CURRENCY || 'GMD';
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'LE.SS WiFi';

// CORS Configuration - Allow all origins in development
const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost', 'http://127.0.0.1', 'http://0.0.0.0'];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) return callback(null, true);

        // In production on DO, frontend and backend are on the same .ondigitalocean.app domain
        const isDigitalOcean = origin.endsWith('.ondigitalocean.app');

        // In development, allow common local origins
        const allowedPatterns = [
            /^https?:\/\/localhost(:\d+)?$/,
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
            /^https?:\/\/0\.0\.0\.0(:\d+)?$/,
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/  // Local network
        ];
        
        if (isDigitalOcean ||
            allowedPatterns.some(pattern => pattern.test(origin)) ||
            corsOrigins.some(allowed => origin.startsWith(allowed))) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Store pending transactions (in production, use a database)
const transactions = new Map();

/**
 * Map error codes to user-friendly messages
 */
function getErrorMessage(code, fallbackMessage) {
    const errorMessages = {
        'INVALID_REQUEST': 'Invalid payment request. Please check your details and try again.',
        'INVALID_AMOUNT': 'Invalid payment amount. Please select a valid package.',
        'INVALID_PHONE': 'Invalid phone number format. Please use format: +220XXXXXXX',
        'INSUFFICIENT_FUNDS': 'Insufficient funds in your Wave account.',
        'PAYMENT_FAILED': 'Payment could not be processed. Please try again.',
        'SERVICE_UNAVAILABLE': 'Payment service is temporarily unavailable. Please try again later.',
        'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment before trying again.',
        'UNAUTHORIZED': 'Authentication failed. Please contact support.',
        'FORBIDDEN': 'Access denied. Please contact support.',
        'NOT_FOUND': 'Payment service not found. Please contact support.',
        'TIMEOUT': 'Payment request timed out. Please try again.',
        'DUPLICATE_REFERENCE': 'This payment has already been initiated. Please wait or try a new payment.',
        'INVALID_CURRENCY': 'Invalid currency. Only GMD (Gambian Dalasi) is supported.',
        'AMOUNT_TOO_LOW': 'Amount is below minimum. Minimum payment is D5.',
        'AMOUNT_TOO_HIGH': 'Amount exceeds maximum limit.',
        'WAVE_ERROR': 'Wave payment service error. Please try again later.'
    };
    
    return errorMessages[code] || fallbackMessage || 'An error occurred. Please try again.';
}

/**
 * Health check endpoints
 * Handles both /health and / (since DO strips prefixes)
 */
const healthCheck = (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'HexAI WiFi Payment Backend',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
};

/**
 * Log Wave redirect for debugging
 * POST /api/log-redirect
 */
apiRouter.post('/log-redirect', (req, res) => {
    const { page, url, params, timestamp } = req.body;
    console.log(`[${timestamp || new Date().toISOString()}] === WAVE REDIRECT LOG ===`);
    console.log(`Page: ${page}`);
    console.log(`URL: ${url}`);
    console.log(`Parameters:`, JSON.stringify(params, null, 2));
    console.log('=======================================');
    res.json({ status: 'logged' });
});

app.get('/health', healthCheck);
apiRouter.get('/health', healthCheck);
apiRouter.get('/', healthCheck);

/**
 * Get API status
 */
apiRouter.get('/status', (req, res) => {
    res.json({
        status: 'active',
        business: BUSINESS_NAME,
        currency: CURRENCY,
        gateway: 'HexAI Payment Gateway'
    });
});

/**
 * Initiate a payment collection
 * POST /api/payment/initiate
 */
apiRouter.post('/payment/initiate', async (req, res) => {
    try {
        const { 
            amount, 
            package_type, 
            package_name, 
            customer_phone,
            success_url,
            error_url,
            device_info  // MikroTik device information
        } = req.body;

        // Validate required fields
        if (!amount || !package_type) {
            return res.status(400).json({
                status: 'error',
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Amount and package_type are required'
                }
            });
        }

        // Generate unique client reference
        const clientReference = generateReference(package_type);
        
        // Generate voucher code for WiFi access
        const voucherCode = generateVoucherCode(package_type, device_info?.mac);
        
        // Format amount as string with 2 decimal places (e.g., "25.00")
        const amountFormatted = parseFloat(amount).toFixed(2);
        
        // Default HTTPS callback URLs (Wave requires valid HTTPS URLs, not localhost)
        const DEFAULT_SUCCESS_URL = process.env.SUCCESS_URL || 'https://hpg-frontend-m3vhq.ondigitalocean.app/payment/success';
        const DEFAULT_ERROR_URL = process.env.ERROR_URL || 'https://hpg-frontend-m3vhq.ondigitalocean.app/payment/error';
        
        // Check if provided URLs are valid HTTPS (Wave requires HTTPS, not localhost)
        const isValidUrl = (url) => url && url.startsWith('https://');
        
        // Build callback URLs with reference parameter
        // Wave doesn't append parameters, so we must add them ourselves
        const finalSuccessUrl = isValidUrl(success_url) ? success_url : DEFAULT_SUCCESS_URL;
        const finalErrorUrl = isValidUrl(error_url) ? error_url : DEFAULT_ERROR_URL;
        
        // Append reference parameter to callback URLs
        const successUrlWithRef = `${finalSuccessUrl}${finalSuccessUrl.includes('?') ? '&' : '?'}reference=${clientReference}`;
        const errorUrlWithRef = `${finalErrorUrl}${finalErrorUrl.includes('?') ? '&' : '?'}reference=${clientReference}`;
        
        // Prepare the request to HexAI Payment Gateway
        // Match the exact format from the HPG API test script
        const paymentData = {
            amount: amountFormatted,
            currency: CURRENCY,
            client_reference: clientReference,
            success_url: successUrlWithRef,
            error_url: errorUrlWithRef
        };
        
        // Add customer info if a valid phone number is provided
        // Format: +220XXXXXXX (7 digits after country code)
        if (customer_phone && customer_phone.match(/^\+220[0-9]{7}$/)) {
            paymentData.customer_name = 'WiFi Customer';
            paymentData.customer_mobile = customer_phone;
        }

        console.log(`[${new Date().toISOString()}] Initiating payment:`, {
            reference: clientReference,
            amount: `D${amountFormatted}`,
            package: package_name,
            voucher: voucherCode,
            device_mac: device_info?.mac || 'N/A'
        });
        
        // Log the full payload being sent
        console.log(`[${new Date().toISOString()}] Request payload:`, JSON.stringify(paymentData, null, 2));


        // Call HexAI Payment Gateway API
        const response = await fetch(`${API_BASE_URL}/collections/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'x-hexai-key': API_KEY
            },
            body: JSON.stringify(paymentData)
        });

        // Get raw response text first for debugging
        const responseText = await response.text();
        console.log(`[${new Date().toISOString()}] Raw API Response (${response.status}):`, responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { status: 'error', message: responseText };
        }

        if (response.ok && data.status === 'success') {
            // HexAI returns data in data.data object
            const responseData = data.data || data;
            
            // Store transaction info for later reference
            transactions.set(clientReference, {
                amount: parseFloat(amount),
                package_type,
                package_name,
                voucher_code: voucherCode,
                device_info: device_info || {},
                status: 'PENDING',
                created_at: new Date().toISOString(),
                transaction_id: responseData.transaction_id
            });

            console.log(`[${new Date().toISOString()}] Payment initiated successfully:`, {
                reference: clientReference,
                transaction_id: responseData.transaction_id,
                redirect_url: responseData.redirect_url
            });

            return res.json({
                status: 'success',
                data: {
                    transaction_id: responseData.transaction_id,
                    redirect_url: responseData.redirect_url,
                    wave_launch_url: responseData.wave_launch_url,
                    client_reference: clientReference,
                    voucher_code: voucherCode,  // Return voucher for later use
                    status: responseData.status || 'PENDING'
                }
            });
        } else {
            console.error(`[${new Date().toISOString()}] Payment initiation failed:`, data);
            
            // Map API errors to user-friendly messages
            const errorCode = data.error?.code || data.code || 'PAYMENT_FAILED';
            const userMessage = getErrorMessage(errorCode, data.message || data.error?.message);
            
            return res.status(response.status || 400).json({
                status: 'error',
                error: {
                    code: errorCode,
                    message: userMessage,
                    details: data.error?.details || data.message || 'Failed to initiate payment'
                }
            });
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Payment error:`, error);
        
        // Determine error type and provide helpful message
        let errorCode = 'INTERNAL_ERROR';
        let userMessage = 'An unexpected error occurred. Please try again.';
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            errorCode = 'CONNECTION_ERROR';
            userMessage = 'Unable to connect to payment service. Please try again later.';
        } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
            errorCode = 'TIMEOUT_ERROR';
            userMessage = 'Payment request timed out. Please try again.';
        } else if (error.message?.includes('fetch')) {
            errorCode = 'NETWORK_ERROR';
            userMessage = 'Network error. Please check your connection and try again.';
        }
        
        return res.status(500).json({
            status: 'error',
            error: {
                code: errorCode,
                message: userMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

/**
 * Check payment status
 * GET /api/payment/status/:reference
 */
apiRouter.get('/payment/status/:reference', async (req, res) => {
    try {
        const { reference } = req.params;

        // Check local cache first
        const cachedTransaction = transactions.get(reference);
        
        // Call HexAI API to get current status
        const response = await fetch(`${API_BASE_URL}/collections/status/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            const paymentStatus = data.data?.status;
            
            // Update local cache
            if (cachedTransaction) {
                cachedTransaction.status = paymentStatus || cachedTransaction.status;
                cachedTransaction.verified_at = new Date().toISOString();
                transactions.set(reference, cachedTransaction);
            }

            // SECURITY: Only return voucher code if payment is COMPLETED
            // This prevents unauthorized access by just navigating to success URL
            if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCESS' || paymentStatus === 'SUCCEEDED') {
                return res.json({
                    status: 'success',
                    data: {
                        ...data.data,
                        package_info: cachedTransaction ? {
                            package_type: cachedTransaction.package_type,
                            package_name: cachedTransaction.package_name,
                            amount: cachedTransaction.amount,
                            voucher_code: cachedTransaction.voucher_code  // Only sent if verified paid
                        } : null
                    }
                });
            } else {
                // Payment not completed - return status without voucher
                return res.status(402).json({
                    status: 'error',
                    error: {
                        code: 'PAYMENT_NOT_COMPLETED',
                        message: 'Payment has not been completed yet',
                        payment_status: paymentStatus
                    }
                });
            }
        } else {
            return res.status(response.status).json(data);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Status check error:`, error);
        return res.status(500).json({
            status: 'error',
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal error occurred'
            }
        });
    }
});

/**
 * Webhook handler for payment notifications
 * POST /api/webhook
 */
apiRouter.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['wave-signature'] || req.headers['x-webhook-signature'];
        const payload = JSON.stringify(req.body);

        // Verify webhook signature if secret is configured
        if (WEBHOOK_SECRET && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', WEBHOOK_SECRET)
                .update(payload)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.error(`[${new Date().toISOString()}] Invalid webhook signature`);
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const { event, transaction } = req.body;

        console.log(`[${new Date().toISOString()}] Webhook received:`, {
            event,
            transaction_id: transaction?.id,
            reference: transaction?.client_reference,
            status: transaction?.status
        });

        // Handle different webhook events
        switch (event) {
            case 'transaction.completed':
            case 'collection.completed':
                await handlePaymentSuccess(transaction);
                break;
            
            case 'transaction.failed':
            case 'collection.failed':
                await handlePaymentFailed(transaction);
                break;

            default:
                console.log(`[${new Date().toISOString()}] Unhandled webhook event: ${event}`);
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ received: true });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Webhook error:`, error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(transaction) {
    const reference = transaction.client_reference;
    const cachedTransaction = transactions.get(reference);

    if (cachedTransaction) {
        // Use Wave's actual status or set to COMPLETED
        cachedTransaction.status = transaction.status || 'COMPLETED';
        cachedTransaction.completed_at = new Date().toISOString();
        cachedTransaction.wave_transaction_id = transaction.id;
        transactions.set(reference, cachedTransaction);

        console.log(`[${new Date().toISOString()}] Payment successful:`, {
            reference,
            amount: transaction.amount,
            package: cachedTransaction.package_name,
            voucher: cachedTransaction.voucher_code
        });

        // Voucher already generated during initiate - no need to generate again
        // The webhook just confirms payment so we can release the voucher
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(transaction) {
    const reference = transaction.client_reference;
    const cachedTransaction = transactions.get(reference);

    if (cachedTransaction) {
        cachedTransaction.status = 'FAILED';
        cachedTransaction.failed_at = new Date().toISOString();
        transactions.set(reference, cachedTransaction);

        console.log(`[${new Date().toISOString()}] Payment failed:`, {
            reference,
            reason: transaction.failure_reason
        });
    }
}

/**
 * Generate unique reference for transactions
 */
function generateReference(packageType) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `WIFI-${packageType.toUpperCase()}-${timestamp}-${random}`;
}

/**
 * Generate voucher code for MikroTik hotspot authentication
 * Format: PKG-MACADDR-TIMESTAMP-RANDOM
 * This voucher will be used as username/password for MikroTik login
 */
function generateVoucherCode(packageType, macAddress) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Extract MAC address short form (last 6 chars without colons)
    let macShort = 'DEVICE';
    if (macAddress) {
        macShort = macAddress.replace(/[^a-fA-F0-9]/g, '').substring(6, 12).toUpperCase();
    }
    
    // Format: 24H-A1B2C3-TIMESTAMP-ABC123
    return `${packageType.toUpperCase()}-${macShort}-${timestamp}${random}`;
}

/**
 * Get available packages
 * GET /api/packages
 */
apiRouter.get('/packages', (req, res) => {
    res.json({
        status: 'success',
        data: {
            currency: CURRENCY,
            packages: [
                {
                    id: '1h',
                    name: '1 Hour',
                    price: 10.00,
                    duration: '1 hour',
                    features: ['High-speed connection', 'Unlimited access', 'Pay via Wave']
                },
                {
                    id: '24h',
                    name: '24 Hours',
                    price: 25.00,
                    duration: '24 hours',
                    popular: true,
                    features: ['High-speed connection', 'Full day access', 'Pay via Wave', 'Best value!']
                },
                {
                    id: '1w',
                    name: '1 Week',
                    price: 100.00,
                    duration: '7 days',
                    features: ['High-speed connection', '7 days unlimited', 'Pay via Wave', 'Save 40%']
                },
                {
                    id: '1m',
                    name: '1 Month',
                    price: 350.00,
                    duration: '30 days',
                    features: ['High-speed connection', '30 days unlimited', 'Pay via Wave', 'Priority support', 'Save 50%']
                }
            ]
        }
    });
});

/**
 * Get transaction history (for admin)
 * GET /api/transactions
 */
apiRouter.get('/transactions', (req, res) => {
    const transactionList = Array.from(transactions.entries()).map(([ref, data]) => ({
        reference: ref,
        ...data
    }));

    res.json({
        status: 'success',
        data: {
            total: transactionList.length,
            transactions: transactionList.slice(-50) // Last 50 transactions
        }
    });
});

// Mount the API Router
// We mount it at both /api and / to handle different environments:
// 1. Local: http://localhost:3001/api/... works
// 2. DO: https://app.com/api/... strips /api and calls service/..., which matches /...
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global 404 handler for the backend - must be last
// Ensures we always return JSON instead of HTML
app.use((req, res) => {
    console.log(`[${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        status: 'error',
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found on this server`
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     HexAI WiFi Payment Backend Server                      ║
║     LE.SS - Gambia Market                                  ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT}                              ║
║  API Base URL: ${API_BASE_URL}    ║
║  Business: ${BUSINESS_NAME}                                     ║
║  Currency: ${CURRENCY}                                          ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║  - GET  /health              Health check                  ║
║  - GET  /api/status          API status                    ║
║  - GET  /api/packages        Get available packages        ║
║  - POST /api/payment/initiate  Initiate payment            ║
║  - GET  /api/payment/status/:ref  Check payment status     ║
║  - POST /api/webhook         Webhook handler               ║
║  - GET  /api/transactions    Transaction history           ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
