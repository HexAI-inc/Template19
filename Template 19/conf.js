var config = {
    // Textes d'interface
    loginvc: "Entrez votre code voucher puis cliquez sur Connecter.",
    loginup: "Entrez votre nom d'utilisateur et mot de passe<br>puis cliquez sur Connecter.",
    voucherCode: "Code Voucher",
    
    // Configuration du casse
    setCase: "lower", // lowercase, uppercase ou none
    
    // Mode par défaut
    defaultMode: "voucher", // voucher ou member
    
    // Thème
    theme: "modern", // modern, dark, lite
    
    // Configuration du slider
    sliderAutoPlay: true,
    sliderInterval: 3000, // en millisecondes
    
    // Configuration des tarifs
    tariffs: [
        {
            name: "1 Heure",
            price: "2Fcfa",
            features: [
                "Connexion haute vitesse",
                "Support technique inclus",
                "Accès illimité"
            ],
            type: "1h",
            value: 2
        },
        {
            name: "1 Jour",
            price: "8€",
            features: [
                "Connexion haute vitesse",
                "Support technique inclus",
                "Accès illimité 24h",
                "Économisez 40%"
            ],
            type: "1d",
            value: 8
        },
        {
            name: "1 Semaine",
            price: "35€",
            features: [
                "Connexion haute vitesse",
                "Support technique prioritaire",
                "Accès illimité 7 jours",
                "Économisez 60%"
            ],
            type: "1w",
            value: 35
        }
    ],
    
    // Configuration des services
    services: [
        {
            name: "WiFi Rapide",
            description: "Connexion haute vitesse jusqu'à 100 Mbps",
            icon: "wifi"
        },
        {
            name: "Support 24/7",
            description: "Assistance technique disponible 24h/24",
            icon: "support"
        },
        {
            name: "Sécurité",
            description: "Connexion sécurisée avec chiffrement WPA2",
            icon: "security"
        }
    ],
    
    // Configuration du QR Code
    qrCode: {
        enabled: true,
        title: "Connexion Rapide",
        description: "Scannez le QR Code pour vous connecter automatiquement"
    },
    
    // URL du serveur (optionnel)
    url: "https://votre-serveur.com",
    SessionName: "hotspot",
    
    // Configuration des animations
    animations: {
        enabled: true,
        duration: 300
    },
    
    // Configuration responsive
    responsive: {
        mobileBreakpoint: 480,
        tabletBreakpoint: 768
    }
};
