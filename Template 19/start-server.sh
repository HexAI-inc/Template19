#!/bin/bash

echo "🚀 Démarrage du serveur local pour le hotspot WiFi..."
echo "📁 Répertoire: $(pwd)"
echo "🌐 URL: http://localhost:8000"
echo "📱 Ouvrez votre navigateur et allez sur: http://localhost:8000/login-simple.html"
echo ""
echo "Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

# Vérifier si Python est installé
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 trouvé, démarrage du serveur..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python trouvé, démarrage du serveur..."
    python -m http.server 8000
else
    echo "❌ Python non trouvé. Veuillez installer Python 3."
    echo "Sur macOS: brew install python3"
    exit 1
fi 