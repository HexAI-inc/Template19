// Script de diagnostic pour la configuration
console.log('🔍 Démarrage du diagnostic de configuration...');

// Vérifier les fichiers de configuration
async function checkConfigFiles() {
    console.log('📁 Vérification des fichiers de configuration...');
    
    try {
        const response = await fetch('config-simple.json');
        if (response.ok) {
            console.log('✅ config-simple.json trouvé et accessible');
            const config = await response.json();
            console.log('📋 Configuration chargée:', config);
            return config;
        } else {
            console.error('❌ config-simple.json non trouvé ou inaccessible');
            return null;
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement de config-simple.json:', error);
        return null;
    }
}

// Vérifier les éléments DOM
function checkDOMElements() {
    console.log('🏗️ Vérification des éléments DOM...');
    
    const elements = {
        'brand-name': document.querySelector('.brand-name'),
        'slider': document.getElementById('slider'),
        'sliderDots': document.getElementById('sliderDots'),
        'infologin': document.getElementById('infologin'),
        'tariffs-container': document.querySelector('.tariffs-container'),
        'bottom-navbar': document.querySelector('.bottom-navbar'),
        'login-form': document.querySelector('form[name="login"]'),
        'username-input': document.querySelector('input[name="username"]'),
        'submit-button': document.querySelector('input[type="submit"]')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        if (element) {
            console.log(`✅ ${name}: trouvé`);
        } else {
            console.error(`❌ ${name}: non trouvé`);
        }
    });
    
    return elements;
}

// Vérifier les styles CSS
function checkCSS() {
    console.log('🎨 Vérification des styles CSS...');
    
    const styles = getComputedStyle(document.body);
    const cssVars = {
        '--primary-color': styles.getPropertyValue('--primary-color'),
        '--text-color': styles.getPropertyValue('--text-color'),
        '--background': styles.getPropertyValue('--background')
    };
    
    Object.entries(cssVars).forEach(([varName, value]) => {
        if (value && value.trim() !== '') {
            console.log(`✅ ${varName}: ${value}`);
        } else {
            console.warn(`⚠️ ${varName}: non défini`);
        }
    });
}

// Vérifier les images
async function checkImages() {
    console.log('🖼️ Vérification des images...');
    
    const images = ['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/voucher.svg', 'img/password.svg'];
    
    for (const image of images) {
        try {
            const response = await fetch(image);
            if (response.ok) {
                console.log(`✅ ${image}: accessible`);
            } else {
                console.error(`❌ ${image}: non accessible (${response.status})`);
            }
        } catch (error) {
            console.error(`❌ ${image}: erreur de chargement`, error);
        }
    }
}

// Vérifier les scripts
function checkScripts() {
    console.log('📜 Vérification des scripts...');
    
    const scripts = [
        'js/simple-config.js',
        'js/theme-toggle.js',
        'css/style.css'
    ];
    
    scripts.forEach(script => {
        const scriptElement = document.querySelector(`script[src="${script}"], link[href="${script}"]`);
        if (scriptElement) {
            console.log(`✅ ${script}: chargé`);
        } else {
            console.error(`❌ ${script}: non chargé`);
        }
    });
}

// Test de fonctionnalité
function testFunctionality() {
    console.log('🧪 Test de fonctionnalité...');
    
    // Test du slider
    const slider = document.getElementById('slider');
    if (slider) {
        console.log('✅ Slider trouvé, test de défilement...');
        slider.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            slider.style.transform = 'translateX(0)';
            console.log('✅ Animation du slider fonctionne');
        }, 1000);
    }
    
    // Test des variables CSS
    const root = document.documentElement;
    const testVar = getComputedStyle(root).getPropertyValue('--primary-color');
    if (testVar) {
        console.log('✅ Variables CSS fonctionnelles');
    } else {
        console.error('❌ Variables CSS non fonctionnelles');
    }
}

// Diagnostic complet
async function runFullDiagnostic() {
    console.log('🚀 Démarrage du diagnostic complet...');
    console.log('='.repeat(50));
    
    // Vérifications de base
    await checkConfigFiles();
    checkDOMElements();
    checkCSS();
    await checkImages();
    checkScripts();
    
    console.log('='.repeat(50));
    
    // Tests de fonctionnalité
    setTimeout(() => {
        testFunctionality();
        console.log('='.repeat(50));
        console.log('🏁 Diagnostic terminé');
    }, 1000);
}

// Exécuter le diagnostic quand le DOM est chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFullDiagnostic);
} else {
    runFullDiagnostic();
}

// Exposer les fonctions pour le débogage
window.debugConfig = {
    checkConfigFiles,
    checkDOMElements,
    checkCSS,
    checkImages,
    checkScripts,
    testFunctionality,
    runFullDiagnostic
}; 