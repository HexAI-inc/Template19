# 🌐 Hotspot WiFi Moderne

Un système de hotspot WiFi moderne et élégant avec interface utilisateur améliorée, cartes de tarifs, slider d'images et navigation intuitive.

## ✨ Fonctionnalités

### 🎨 Interface Moderne
- Design responsive avec dégradés modernes
- Animations fluides et transitions élégantes
- Interface utilisateur intuitive et accessible
- Support mobile et desktop

### 💳 Cartes de Tarifs
- Affichage des différents forfaits WiFi
- Boutons d'achat intégrés
- Prix et fonctionnalités clairement présentés
- Design de cartes avec effets hover

### 🖼️ Slider d'Images
- Carrousel automatique avec 3 images
- Navigation par points
- Transitions fluides
- Contenu promotionnel intégré

### 📱 Navigation du Bas
- Barre de navigation fixe en bas
- 3 sections principales : QR Code, Services, Tarifs
- Icônes SVG modernes
- Navigation tactile optimisée

### 🔐 Systèmes d'Authentification
- Mode Voucher (code d'accès)
- Mode Membre (nom d'utilisateur + mot de passe)
- Support CHAP pour MikroTik
- Validation automatique des entrées

## 🚀 Installation

1. **Téléchargez les fichiers** dans votre répertoire web
2. **Configurez votre serveur** MikroTik pour pointer vers `login.html`
3. **Personnalisez** le fichier `conf.js` selon vos besoins
4. **Testez** la connexion

## ⚙️ Configuration

### Fichier `conf.js`

```javascript
var config = {
    // Textes d'interface
    loginvc: "Entrez votre code voucher puis cliquez sur Connecter.",
    loginup: "Entrez votre nom d'utilisateur et mot de passe...",
    
    // Configuration du casse
    setCase: "lower", // lowercase, uppercase ou none
    
    // Mode par défaut
    defaultMode: "voucher", // voucher ou member
    
    // Thème
    theme: "modern", // modern, dark, lite
    
    // Configuration des tarifs
    tariffs: [
        {
            name: "1 Heure",
            price: "2€",
            features: ["Connexion haute vitesse", "Support technique inclus"],
            type: "1h",
            value: 2
        }
        // ... autres tarifs
    ]
};
```

### Personnalisation des Tarifs

Modifiez le tableau `tariffs` dans `conf.js` pour ajouter ou modifier vos forfaits :

```javascript
tariffs: [
    {
        name: "Nom du forfait",
        price: "Prix",
        features: ["Fonctionnalité 1", "Fonctionnalité 2"],
        type: "identifiant",
        value: prix_numerique
    }
]
```

## 📁 Structure des Fichiers

```
hotspot-wifi/
├── login.html          # Page principale de connexion
├── conf.js             # Configuration du système
├── css/
│   └── style.css       # Styles modernes
├── img/
│   ├── user.svg        # Icône utilisateur
│   ├── password.svg    # Icône mot de passe
│   └── voucher.svg     # Icône voucher
├── md5.js              # Bibliothèque de hachage MD5
└── README.md           # Documentation
```

## 🎯 Fonctionnalités Avancées

### Slider Automatique
- Défilement automatique toutes les 3 secondes
- Navigation manuelle par points
- Transitions CSS fluides

### Système de Navigation
- QR Code : Affichage du code QR pour connexion rapide
- Services : Liste des services disponibles
- Tarifs : Scroll automatique vers les cartes de tarifs

### Responsive Design
- Adaptation automatique aux écrans mobiles
- Interface tactile optimisée
- Breakpoints configurables

## 🔧 Personnalisation

### Couleurs et Thème
Modifiez les variables CSS dans `style.css` :

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #4CAF50;
    --text-color: #fff;
    --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Images du Slider
Remplacez les images SVG par défaut par vos propres images :

```css
.slide-1 { background-image: url('votre-image-1.jpg'); }
.slide-2 { background-image: url('votre-image-2.jpg'); }
.slide-3 { background-image: url('votre-image-3.jpg'); }
```

## 📱 Compatibilité

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## 🔒 Sécurité

- Support CHAP pour MikroTik
- Validation des entrées côté client
- Protection contre les injections
- Hachage MD5 des mots de passe

## 🛠️ Développement

### Ajout de Nouvelles Fonctionnalités

1. **Modifiez** `conf.js` pour ajouter les paramètres
2. **Mettez à jour** `login.html` pour l'interface
3. **Ajoutez** les styles dans `style.css`
4. **Testez** sur différents appareils

### Debugging

Ouvrez la console du navigateur pour voir les logs :
```javascript
console.log('Configuration:', config);
console.log('Mode actuel:', localStorage.getItem('mode'));
```

## 📞 Support

Pour toute question ou problème :
- Vérifiez la configuration dans `conf.js`
- Consultez la console du navigateur
- Testez sur différents appareils
- Vérifiez la compatibilité avec votre serveur MikroTik

## 📄 Licence

Ce projet est open source et peut être modifié selon vos besoins.

---

**Propulsé par MikroTik RouterOS** 🚀
