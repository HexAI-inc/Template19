var config = {
    // Interface texts - English for Gambia market
    loginvc: "Enter your voucher code then click Connect.",
    loginup: "Enter your username and password<br>then click Connect.",
    voucherCode: "Voucher Code",
    
    // Case configuration
    setCase: "lower", // lowercase, uppercase or none
    
    // Default mode
    defaultMode: "voucher", // voucher or member
    
    // Theme
    theme: "modern", // modern, dark, lite
    
    // Slider configuration
    sliderAutoPlay: true,
    sliderInterval: 3000, // milliseconds
    
    // HexAI Payment Gateway Configuration
    hexai: {
        apiBaseUrl: "https://hpg.hexai.gm/api/v1",
        // API key should be set server-side for security, this is for reference
        // apiKey: "sk_live_YOUR_API_KEY", // DO NOT expose in production
        currency: "GMD",
        businessName: "LE.SS WiFi Gambia",
        successUrl: window.location.origin + "/alogin-gambia.html",
        errorUrl: window.location.origin + "/error-gambia.html"
    },
    
    // Tariff configuration - Gambia Market (GMD - Dalasi)
    tariffs: [
        {
            name: "1 Hour",
            price: "D10",
            priceValue: 10.00,
            features: [
                "High-speed connection",
                "Unlimited access",
                "Pay via Wave"
            ],
            type: "1h",
            duration: "1 hour"
        },
        {
            name: "24 Hours",
            price: "D25",
            priceValue: 25.00,
            features: [
                "High-speed connection",
                "Full day access",
                "Pay via Wave",
                "Best value!"
            ],
            type: "24h",
            duration: "24 hours",
            popular: true
        },
        {
            name: "1 Week",
            price: "D100",
            priceValue: 100.00,
            features: [
                "High-speed connection",
                "7 days unlimited",
                "Pay via Wave",
                "Save 40%"
            ],
            type: "1w",
            duration: "7 days"
        },
        {
            name: "1 Month",
            price: "D350",
            priceValue: 350.00,
            features: [
                "High-speed connection",
                "30 days unlimited",
                "Pay via Wave",
                "Priority support",
                "Save 50%"
            ],
            type: "1m",
            duration: "30 days"
        }
    ],
    
    // Services configuration
    services: [
        {
            name: "Fast WiFi",
            description: "High-speed connection up to 100 Mbps",
            icon: "wifi"
        },
        {
            name: "24/7 Support",
            description: "Technical assistance available anytime",
            icon: "support"
        },
        {
            name: "Security",
            description: "Secure connection with WPA2 encryption",
            icon: "security"
        },
        {
            name: "Wave Payment",
            description: "Easy payment via Wave Mobile Money",
            icon: "payment"
        }
    ],
    
    // QR Code configuration
    qrCode: {
        enabled: true,
        title: "Quick Connect",
        description: "Scan the QR Code to connect automatically"
    },
    
    // Server URL (optional)
    url: "https://wifi.hexai.gm",
    SessionName: "hexai-hotspot",
    
    // Contact information - Gambia
    contact: {
        phone: "+220 709 0041",
        whatsapp: "+220 709 0041",
        email: "support@swiftlink.gm"
    },
    
    // Animation configuration
    animations: {
        enabled: true,
        duration: 300
    },
    
    // Responsive configuration
    responsive: {
        mobileBreakpoint: 480,
        tabletBreakpoint: 768
    }
};
