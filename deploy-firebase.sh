#!/bin/bash

# Script de déploiement Firebase Functions pour NuovaLingua
echo "🚀 Déploiement des Firebase Functions pour NuovaLingua..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "firebase.json" ]; then
    echo "❌ Erreur: firebase.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Vérifier la connexion Firebase
echo "🔍 Vérification de la connexion Firebase..."
npx firebase-tools projects:list

if [ $? -ne 0 ]; then
    echo "❌ Erreur: Connexion Firebase échouée. Veuillez vous connecter avec: npx firebase-tools login"
    exit 1
fi

# Installer les dépendances des Functions
echo "📦 Installation des dépendances des Functions..."
cd functions
npm install
cd ..

# Déployer les Functions
echo "🚀 Déploiement des Functions..."
npx firebase-tools deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Déploiement réussi!"
    echo "🔗 Vos Functions sont maintenant disponibles:"
    echo "   - extractWebContent: https://us-central1-nuovalingua4.cloudfunctions.net/extractWebContent"
    echo "   - testFunction: https://us-central1-nuovalingua4.cloudfunctions.net/testFunction"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi
