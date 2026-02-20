/**
 * MikroTik Hotspot Helper
 * Utilities for capturing device info and auto-login for WiFi voucher system
 */

const MikroTikHelper = {
    /**
     * Extract MikroTik variables from the current page URL
     * These are passed as query parameters when MikroTik redirects to the hotspot
     */
    getDeviceInfo() {
        const params = new URLSearchParams(window.location.search);
        
        const cleanParam = (name, placeholder) => {
            const val = params.get(name);
            // If the parameter is missing OR is a MikroTik placeholder like $(mac)
            if (!val || (val.includes('$(') && val.includes(')'))) {
                const pageVal = this.extractFromPage(placeholder);
                return pageVal;
            }
            return val;
        };

        return {
            mac: cleanParam('mac', '$(mac)'),
            ip: cleanParam('ip', '$(ip)'),
            username: cleanParam('username', '$(username)'),
            linkLoginOnly: cleanParam('link-login-only', '$(link-login-only)'),
            linkOrig: params.get('link-orig') || params.get('dst') || cleanParam('link-orig', '$(link-orig)'),
            sessionId: params.get('session-id') || '',
            linkLoginUrl: cleanParam('link-login-only', '$(link-login-only)'),
            // Additional info
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Try to extract MikroTik variables from the HTML page
     * This works when the page is served by MikroTik hotspot
     */
    extractFromPage(variable) {
        // Find all hidden inputs or inputs with value matching common patterns
        const inputs = document.querySelectorAll('input[type="hidden"], input[name], form[action]');
        
        // Helper to check if value is valid (not a MikroTik placeholder)
        const isValid = (val) => val && !(val.includes('$(') && val.includes(')'));

        // 1. Check if the value itself matched the variable (e.g., value="$(mac)")
        // but we want the REPLACED value.
        // If the variable is $(mac) and we find value="00:11:22:33:44:55", that's what we want.

        // This is tricky because we don't know the exact ID/Name MikroTik uses for its variables.
        // Usually it's name="mac", name="ip", etc.
        const varName = variable.replace(/[()$]/g, ''); // $(mac) -> mac
        
        const targetInput = document.querySelector(`input[name="${varName}"], input[id="${varName}"]`);
        if (targetInput && isValid(targetInput.value)) {
            return targetInput.value;
        }

        // Special handling for dst/link-orig
        if (varName === 'link-orig' || varName === 'dst') {
            const dst = document.querySelector('input[name="dst"]');
            if (dst && isValid(dst.value)) return dst.value;
        }

        return '';
    },

    /**
     * Generate a unique voucher code for a paid user
     * Format: PKG-MACADDR-TIMESTAMP
     */
    generateVoucherCode(packageType, mac) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const macShort = (mac || 'DEVICE').replace(/:/g, '').substring(0, 6).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        return `${packageType.toUpperCase()}-${macShort}-${timestamp}${random}`;
    },

    /**
     * Auto-login to MikroTik hotspot with voucher code
     */
    autoLogin(voucherCode, loginUrl, destination) {
        if (!loginUrl) {
            console.warn('No MikroTik login URL available for auto-login');
            return false;
        }

        // Create a hidden form to submit the login
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = loginUrl;
        form.style.display = 'none';

        // Add username (voucher code)
        const usernameInput = document.createElement('input');
        usernameInput.type = 'hidden';
        usernameInput.name = 'username';
        usernameInput.value = voucherCode;
        form.appendChild(usernameInput);

        // Add password (same as username for voucher-based auth)
        const passwordInput = document.createElement('input');
        passwordInput.type = 'hidden';
        passwordInput.name = 'password';
        passwordInput.value = voucherCode;
        form.appendChild(passwordInput);

        // Add destination URL
        if (destination) {
            const dstInput = document.createElement('input');
            dstInput.type = 'hidden';
            dstInput.name = 'dst';
            dstInput.value = destination;
            form.appendChild(dstInput);
        }

        // Submit the form
        document.body.appendChild(form);
        form.submit();
        
        return true;
    },

    /**
     * Store voucher info in localStorage for later retrieval
     */
    storeVoucher(voucherData) {
        const vouchers = this.getStoredVouchers();
        vouchers.push({
            ...voucherData,
            createdAt: new Date().toISOString()
        });
        
        // Keep only the last 10 vouchers
        if (vouchers.length > 10) {
            vouchers.shift();
        }
        
        localStorage.setItem('hexai_vouchers', JSON.stringify(vouchers));
    },

    /**
     * Get stored vouchers from localStorage
     */
    getStoredVouchers() {
        try {
            const stored = localStorage.getItem('hexai_vouchers');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Check if we're on a MikroTik hotspot page
     */
    isMikroTikHotspot() {
        // Check for common MikroTik indicators
        const indicators = [
            document.querySelector('input[name="dst"]'),
            document.querySelector('form[action*="link-login"]'),
            window.location.search.includes('mac='),
            window.location.search.includes('link-login'),
            document.body.innerHTML.includes('$(')
        ];
        
        return indicators.some(indicator => indicator);
    },

    /**
     * Format MAC address consistently
     */
    formatMAC(mac) {
        if (!mac) return '';
        // Convert to XX:XX:XX:XX:XX:XX format
        return mac.replace(/[^a-fA-F0-9]/g, '')
                  .match(/.{1,2}/g)
                  ?.join(':')
                  .toUpperCase() || mac;
    }
};

// Auto-detect MikroTik environment on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (MikroTikHelper.isMikroTikHotspot()) {
            console.log('MikroTik Hotspot detected');
            const deviceInfo = MikroTikHelper.getDeviceInfo();
            console.log('Device Info:', deviceInfo);
            
            // Store in sessionStorage for payment flow
            sessionStorage.setItem('mikrotik_device_info', JSON.stringify(deviceInfo));
        }
    });
}
