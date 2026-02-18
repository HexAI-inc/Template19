/**
 * HexAI Payment Gateway Integration for Wave Mobile Money
 * Gambia Market - WiFi Hotspot Payment System
 * LE.SS WiFi
 * 
 * Backend API: http://localhost:3001/api
 * HexAI Gateway: https://hpg-backend-6kzwb.ondigitalocean.app/api/v1
 * Documentation: https://hpg-frontend-m3vhq.ondigitalocean.app/docs/api-reference
 */

const HexAIPayment = {
    // Configuration - auto-detects environment
    config: {
        // In production on DO, the backend is served from /api on the same domain.
        // Locally the backend runs on port 3001.
        backendUrl: (() => {
            const host = window.location.hostname;
            const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
            return isLocal ? 'http://localhost:3001' : '';  // empty = same origin in production
        })(),
        currency: 'GMD',
    },

    /**
     * Initialize payment for a WiFi package
     * @param {Object} params - Payment parameters
     * @param {number} params.amount - Amount in GMD (e.g., 25.00 for D25)
     * @param {string} params.packageType - Package type identifier (e.g., '24h', '1w')
     * @param {string} params.packageName - Human-readable package name
     * @param {string} params.customerPhone - Customer's Wave number (optional)
     * @param {string} params.successUrl - URL to redirect on success
     * @param {string} params.errorUrl - URL to redirect on error
     */
    async initiatePayment(params) {
        const {
            amount,
            packageType,
            packageName,
            customerPhone = '',
            successUrl,
            errorUrl
        } = params;

        // Generate unique client reference
        const clientReference = this.generateReference(packageType);

        // Store payment info in sessionStorage for callback handling
        sessionStorage.setItem('hexai_payment', JSON.stringify({
            reference: clientReference,
            packageType: packageType,
            packageName: packageName,
            amount: amount,
            timestamp: Date.now()
        }));

        try {
            // Call our backend server which securely handles the HexAI API call
            const response = await fetch(`${this.config.backendUrl}/api/payment/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: String(amount),
                    currency: this.config.currency,
                    client_reference: clientReference,
                    package_type: packageType,
                    package_name: packageName,
                    customer_phone: customerPhone,
                    success_url: successUrl || window.location.origin + '/alogin-gambia.html',
                    error_url: errorUrl || window.location.origin + '/error-gambia.html'
                })
            });

            const data = await response.json();
            console.log('Payment API Response:', data);

            // Handle the Wave checkout URL from response
            if (data.status === 'success' && data.data && data.data.wave_launch_url) {
                // Open Wave checkout in browser (new tab to avoid app deep-link)
                const paymentUrl = data.data.wave_launch_url;
                this.openPaymentInBrowser(paymentUrl);
                return { success: true, transactionId: data.data.transaction_id, reference: data.data.reference };
            } else if (data.status === 'success' && data.data && data.data.redirect_url) {
                // Alternative field name for redirect URL
                const paymentUrl = data.data.redirect_url;
                this.openPaymentInBrowser(paymentUrl);
                return { success: true, transactionId: data.data.transaction_id };
            } else {
                throw new Error(data.message || data.error?.message || 'Payment initiation failed');
            }
        } catch (error) {
            console.error('HexAI Payment Error:', error);
            
            // Determine user-friendly error message
            let userMessage = 'Payment failed. Please try again.';
            let errorCode = 'UNKNOWN_ERROR';
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                userMessage = 'Unable to connect to payment server. Please check your internet connection.';
                errorCode = 'CONNECTION_ERROR';
            } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
                userMessage = 'Network error. Please check your internet connection and try again.';
                errorCode = 'NETWORK_ERROR';
            } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                userMessage = 'Request timed out. Please try again.';
                errorCode = 'TIMEOUT_ERROR';
            } else if (error.message) {
                userMessage = error.message;
            }
            
            return { success: false, error: userMessage, code: errorCode };
        }
    },

    /**
     * Alternative: Direct redirect to payment page (for simpler integration)
     * This creates a payment link that users can click
     */
    createPaymentLink(packageType, amount, packageName) {
        const reference = this.generateReference(packageType);
        const params = new URLSearchParams({
            amount: amount.toFixed(2),
            currency: 'GMD',
            ref: reference,
            package: packageType,
            name: encodeURIComponent(packageName),
            success: window.location.origin + '/alogin-gambia.html',
            error: window.location.origin + '/error-gambia.html'
        });
        
        // This should point to your payment processing page
        return `/pay.html?${params.toString()}`;
    },

    /**
     * Generate unique reference for transaction
     */
    generateReference(packageType) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `WIFI-${packageType.toUpperCase()}-${timestamp}-${random}`;
    },

    /**
     * Check payment status
     * @param {string} reference - The client reference from payment initiation
     */
    async checkPaymentStatus(reference) {
        try {
            const response = await fetch(`${this.config.backendUrl}/api/payment/status/${reference}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Status Check Error:', error);
            return { status: 'error', error: error.message };
        }
    },

    /**
     * Handle successful payment callback
     * Called when user returns from Wave checkout
     */
    handlePaymentSuccess() {
        const paymentData = sessionStorage.getItem('hexai_payment');
        if (paymentData) {
            const payment = JSON.parse(paymentData);
            // Clear stored data
            sessionStorage.removeItem('hexai_payment');
            return payment;
        }
        return null;
    },

    /**
     * Display payment modal/UI - pre-fetches the Wave URL immediately on open
     */
    showPaymentUI(tariff) {
        // Create modal overlay - button starts in loading state
        const modal = document.createElement('div');
        modal.className = 'hexai-payment-modal';
        modal.innerHTML = `
            <div class="hexai-payment-content">
                <div class="hexai-payment-header">
                    <span class="macos-dot red"></span>
                    <span class="macos-dot yellow"></span>
                    <span class="macos-dot green"></span>
                    <button class="hexai-close-btn" onclick="HexAIPayment.closeModal()">&times;</button>
                </div>
                <div class="hexai-payment-body">
                    <div class="hexai-wave-logo">
                        <svg viewBox="0 0 100 100" width="60" height="60">
                            <circle cx="50" cy="50" r="45" fill="#1DC9FF"/>
                            <path d="M30 50 Q40 35 50 50 Q60 65 70 50" stroke="#fff" stroke-width="6" fill="none"/>
                        </svg>
                    </div>
                    <h3>Pay with Wave</h3>
                    <div class="hexai-package-info">
                        <div class="hexai-package-name">${tariff.name}</div>
                        <div class="hexai-package-price">${tariff.price}</div>
                        <div class="hexai-package-duration">${tariff.duration || tariff.type}</div>
                    </div>
                    <p class="hexai-payment-note">You will be redirected to Wave to complete your payment securely.</p>
                    <button class="hexai-pay-btn" id="hexai-pay-btn" disabled>
                        <span class="hexai-spinner"></span> Preparing payment...
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Pre-fetch the Wave payment URL immediately in the background
        this._prefetchPaymentUrl(tariff);
    },

    /**
     * Pre-fetch the Wave URL as soon as modal opens
     * Stores result and enables button immediately when ready
     */
    async _prefetchPaymentUrl(tariff) {
        this._pendingPaymentUrl = null;

        try {
            const clientReference = this.generateReference(tariff.type);

            sessionStorage.setItem('hexai_payment', JSON.stringify({
                reference: clientReference,
                packageType: tariff.type,
                packageName: tariff.name,
                amount: tariff.priceValue,
                timestamp: Date.now()
            }));

            const response = await fetch(`${this.config.backendUrl}/api/payment/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: String(tariff.priceValue),
                    currency: this.config.currency,
                    client_reference: clientReference,
                    package_type: tariff.type,
                    package_name: tariff.name
                })
            });

            const data = await response.json();
            console.log('Pre-fetched payment URL:', data);

            const paymentUrl = data?.data?.wave_launch_url || data?.data?.redirect_url;

            if (data.status === 'success' && paymentUrl) {
                // URL is ready - update button immediately
                this._pendingPaymentUrl = paymentUrl;
                const btn = document.getElementById('hexai-pay-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `
                        <svg viewBox="0 0 100 100" width="22" height="22">
                            <circle cx="50" cy="50" r="45" fill="#fff"/>
                            <path d="M30 50 Q40 35 50 50 Q60 65 70 50" stroke="#1DC9FF" stroke-width="6" fill="none"/>
                        </svg>
                        Pay ${tariff.price} with Wave
                    `;
                    btn.onclick = () => this._launchPrefetchedPayment();
                }
            } else {
                throw new Error(data.message || data.error?.message || 'Failed to prepare payment');
            }
        } catch (error) {
            console.error('Pre-fetch error:', error);
            const btn = document.getElementById('hexai-pay-btn');
            if (btn) {
                const code = error.name === 'TypeError' ? 'CONNECTION_ERROR' : 'PAYMENT_FAILED';
                const msg = this.getErrorMessage(code, error.message);
                this.showError(msg, code);
                btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg> Retry`;
                btn.disabled = false;
                btn.onclick = () => {
                    this.showError('', '');
                    btn.disabled = true;
                    btn.innerHTML = '<span class="hexai-spinner"></span> Preparing payment...';
                    this._prefetchPaymentUrl(tariff);
                };
            }
        }
    },

    /**
     * Launch the pre-fetched Wave URL (called when user clicks Pay)
     */
    _launchPrefetchedPayment() {
        if (this._pendingPaymentUrl) {
            this.openPaymentInBrowser(this._pendingPaymentUrl);
            this._pendingPaymentUrl = null;
        }
    },

    /**
     * Close payment modal
     */
    closeModal() {
        const modal = document.querySelector('.hexai-payment-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Open payment URL in browser (avoids app deep-linking on desktop)
     * @param {string} url - The Wave payment URL
     */
    openPaymentInBrowser(url) {
        // Close the payment modal
        this.closeModal();
        
        // Check if we're on mobile or desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // On mobile, redirect directly (allows Wave app to open if installed)
            window.location.href = url;
        } else {
            // On desktop, open in new tab to force browser view
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            
            // Show a message to user
            this.showPaymentPendingMessage();
            
            // If popup was blocked, fallback to redirect
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.log('Popup blocked, redirecting...');
                window.location.href = url;
            }
        }
    },

    /**
     * Show message while payment is pending in another tab
     */
    showPaymentPendingMessage() {
        const overlay = document.createElement('div');
        overlay.className = 'hexai-payment-pending-overlay';
        overlay.innerHTML = `
            <div class="hexai-payment-pending">
                <div class="hexai-pending-spinner"></div>
                <h3>Complete your payment</h3>
                <p>A new tab has opened with the Wave payment page.</p>
                <p>Complete the payment there, then return here.</p>
                <button onclick="HexAIPayment.closePendingMessage()" class="hexai-cancel-btn">Cancel Payment</button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    /**
     * Close the pending message overlay
     */
    closePendingMessage() {
        const overlay = document.querySelector('.hexai-payment-pending-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Process the payment
     */
    async processPayment(packageType, amount, packageName) {
        const payBtn = document.querySelector('.hexai-pay-btn');
        if (payBtn) {
            payBtn.innerHTML = '<span class="hexai-spinner"></span> Processing...';
            payBtn.disabled = true;
        }

        try {
            const result = await this.initiatePayment({
                amount: amount,
                packageType: packageType,
                packageName: packageName,
                successUrl: window.location.origin + '/alogin-gambia.html',
                errorUrl: window.location.origin + '/error-gambia.html'
            });

            if (!result.success) {
                // Show specific error to user based on error code
                const errorMessage = this.getErrorMessage(result.code, result.error);
                this.showError(errorMessage, result.code);
                
                if (payBtn) {
                    // Show appropriate retry button based on error type
                    const isConnectionError = ['CONNECTION_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR'].includes(result.code);
                    payBtn.innerHTML = isConnectionError 
                        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Try Again`
                        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> Retry Payment`;
                    payBtn.disabled = false;
                }
            }
            // If success, the page will redirect to Wave checkout
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = this.getErrorMessage('UNEXPECTED_ERROR', error.message);
            this.showError(errorMessage, 'UNEXPECTED_ERROR');
            if (payBtn) {
                payBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Try Again`;
                payBtn.disabled = false;
            }
        }
    },

    /**
     * Get user-friendly error message based on error code
     */
    getErrorMessage(code, fallbackMessage) {
        const errorMessages = {
            'CONNECTION_ERROR': 'Unable to connect to payment server. Please check your internet connection and try again.',
            'NETWORK_ERROR': 'Network error occurred. Please check your internet connection.',
            'TIMEOUT_ERROR': 'The request took too long. Please try again.',
            'INVALID_REQUEST': 'Invalid payment request. Please refresh and try again.',
            'PAYMENT_FAILED': 'Payment could not be processed. Please try again or use a different payment method.',
            'INSUFFICIENT_FUNDS': 'Insufficient funds in your Wave account.',
            'INVALID_PHONE': 'Invalid phone number. Please enter a valid Gambian number (+220...).',
            'SERVICE_UNAVAILABLE': 'Payment service is temporarily unavailable. Please try again later.',
            'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
            'UNEXPECTED_ERROR': 'Something went wrong. Please try again.',
            'INTERNAL_ERROR': 'A server error occurred. Please try again later.'
        };
        
        return errorMessages[code] || fallbackMessage || 'Payment failed. Please try again.';
    },

    /**
     * Show error message to user
     */
    showError(message, errorCode = '') {
        const existingError = document.querySelector('.hexai-error-msg');
        if (existingError) existingError.remove();

        // Choose icon based on error type
        const isConnectionError = ['CONNECTION_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR'].includes(errorCode);
        const icon = isConnectionError 
            ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ff9800">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4444">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
               </svg>`;

        const errorDiv = document.createElement('div');
        errorDiv.className = `hexai-error-msg ${isConnectionError ? 'warning' : 'error'}`;
        errorDiv.innerHTML = `
            ${icon}
            <div class="hexai-error-content">
                <span class="hexai-error-text">${message}</span>
                ${errorCode ? `<span class="hexai-error-code">Error: ${errorCode}</span>` : ''}
            </div>
        `;
        
        const paymentBody = document.querySelector('.hexai-payment-body');
        if (paymentBody) {
            paymentBody.insertBefore(errorDiv, paymentBody.querySelector('.hexai-pay-btn'));
        }
        
        // Auto-hide after 10 seconds for non-critical errors
        if (isConnectionError) {
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.classList.add('fade-out');
                    setTimeout(() => errorDiv.remove(), 300);
                }
            }, 10000);
        }
    }
};

// Add CSS styles for the payment modal
const hexaiStyles = document.createElement('style');
hexaiStyles.textContent = `
    .hexai-payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    
    .hexai-payment-content {
        background: linear-gradient(135deg, #1a2a3a 0%, #0d1520 100%);
        border-radius: 20px;
        width: 90%;
        max-width: 380px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .hexai-payment-header {
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
    }
    
    .hexai-close-btn {
        position: absolute;
        right: 16px;
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .hexai-close-btn:hover {
        opacity: 1;
    }
    
    .hexai-payment-body {
        padding: 30px;
        text-align: center;
    }
    
    .hexai-wave-logo {
        margin-bottom: 20px;
    }
    
    .hexai-payment-body h3 {
        color: #fff;
        font-size: 1.5rem;
        margin-bottom: 20px;
    }
    
    .hexai-package-info {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .hexai-package-name {
        color: #1DC9FF;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 8px;
    }
    
    .hexai-package-price {
        color: #fff;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 4px;
    }
    
    .hexai-package-duration {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
    }
    
    .hexai-payment-note {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
        margin-bottom: 20px;
    }
    
    .hexai-pay-btn {
        width: 100%;
        padding: 16px 24px;
        background: linear-gradient(135deg, #1DC9FF 0%, #0099CC 100%);
        color: #fff;
        border: none;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .hexai-pay-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(29, 201, 255, 0.4);
    }
    
    .hexai-pay-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
    
    .hexai-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: hexai-spin 0.8s linear infinite;
    }
    
    @keyframes hexai-spin {
        to { transform: rotate(360deg); }
    }
    
    .hexai-error-msg {
        background: rgba(255, 68, 68, 0.15);
        border: 1px solid rgba(255, 68, 68, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        color: #ff6666;
        font-size: 0.9rem;
        text-align: left;
        animation: hexai-slide-in 0.3s ease-out;
    }
    
    .hexai-error-msg.warning {
        background: rgba(255, 152, 0, 0.15);
        border-color: rgba(255, 152, 0, 0.3);
        color: #ffb74d;
    }
    
    .hexai-error-msg svg {
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .hexai-error-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .hexai-error-text {
        line-height: 1.4;
    }
    
    .hexai-error-code {
        font-size: 0.75rem;
        opacity: 0.7;
        font-family: monospace;
    }
    
    .hexai-error-msg.fade-out {
        animation: hexai-fade-out 0.3s ease-out forwards;
    }
    
    @keyframes hexai-slide-in {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes hexai-fade-out {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
    
    /* Payment pending overlay (shown when payment opens in new tab) */
    .hexai-payment-pending-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        backdrop-filter: blur(10px);
    }
    
    .hexai-payment-pending {
        background: linear-gradient(135deg, #1a2a3a 0%, #0d1520 100%);
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 400px;
        border: 1px solid rgba(29, 201, 255, 0.3);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .hexai-payment-pending h3 {
        color: #fff;
        font-size: 1.5rem;
        margin-bottom: 16px;
    }
    
    .hexai-payment-pending p {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 12px;
        line-height: 1.5;
    }
    
    .hexai-pending-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(29, 201, 255, 0.2);
        border-top-color: #1DC9FF;
        border-radius: 50%;
        animation: hexai-spin 1s linear infinite;
        margin: 0 auto 24px;
    }
    
    .hexai-cancel-btn {
        margin-top: 20px;
        padding: 12px 24px;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
    }
    
    .hexai-cancel-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.5);
    }
`;
document.head.appendChild(hexaiStyles);

// Export for use in other scripts
window.HexAIPayment = HexAIPayment;
