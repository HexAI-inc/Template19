// Gestionnaire de basculement de thème
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Appliquer le thème sauvegardé
        this.applyTheme(this.currentTheme);
        
        // Créer le bouton de basculement
        this.createToggleButton();
        
        // Ajouter la classe de transition au body
        document.body.classList.add('theme-transition');
    }

    createToggleButton() {
        // Créer le bouton de basculement
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.setAttribute('aria-label', 'Basculer le thème');
        toggleBtn.innerHTML = this.getThemeIcon();
        
        // Ajouter l'événement de clic
        toggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Trouver le logo de marque et ajouter le bouton
        const brandLogo = document.querySelector('.octalink-logo');
        if (brandLogo) {
            brandLogo.appendChild(toggleBtn);
        } else {
            // Fallback: ajouter au body
            document.body.appendChild(toggleBtn);
        }
    }

    getThemeIcon() {
        return this.currentTheme === 'dark' 
            ? `<svg viewBox="0 0 24 24">
                <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
                <path d="M12 1v2"/>
                <path d="M12 21v2"/>
                <path d="M4.22 4.22l1.42 1.42"/>
                <path d="M18.36 18.36l1.42 1.42"/>
                <path d="M1 12h2"/>
                <path d="M21 12h2"/>
                <path d="M4.22 19.78l1.42-1.42"/>
                <path d="M18.36 5.64l1.42-1.42"/>
               </svg>`
            : `<svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/>
                <path d="M12 20v2"/>
                <path d="M4.93 4.93l1.41 1.41"/>
                <path d="M17.66 17.66l1.41 1.41"/>
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="M6.34 17.66l-1.41 1.41"/>
                <path d="M19.07 4.93l-1.41 1.41"/>
               </svg>`;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        
        // Mettre à jour l'attribut data-theme
        document.documentElement.setAttribute('data-theme', theme);
        
        // Sauvegarder dans localStorage
        localStorage.setItem('theme', theme);
        
        // Mettre à jour l'icône du bouton
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.getThemeIcon();
        }
        
        // Animation de transition
        this.animateThemeChange();
    }

    animateThemeChange() {
        // Ajouter une classe temporaire pour l'animation
        document.body.classList.add('theme-changing');
        
        // Retirer la classe après l'animation
        setTimeout(() => {
            document.body.classList.remove('theme-changing');
        }, 300);
    }
}

// Initialiser le gestionnaire de thème quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});

// Initialiser aussi si le script est chargé après le DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeManager();
    });
} else {
    new ThemeManager();
} 