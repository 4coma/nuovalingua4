#!/bin/bash
# Script pour générer le bundle AAB signé pour Google Play

echo "📦 Génération du bundle AAB pour Google Play"
echo "=============================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier si le keystore existe
KEYSTORE_PATH="android/app/nuovalingua-release-key.jks"
KEYSTORE_PROPERTIES="android/keystore.properties"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Keystore non trouvé : $KEYSTORE_PATH"
    echo ""
    echo "Créez d'abord le keystore avec :"
    echo "  cd android && ./setup-keystore.sh"
    exit 1
fi

if [ ! -f "$KEYSTORE_PROPERTIES" ]; then
    echo "❌ Fichier keystore.properties non trouvé"
    echo ""
    echo "Créez-le en copiant keystore.properties.example et remplissez les valeurs"
    exit 1
fi

echo "✅ Keystore trouvé"
echo ""

# Build de l'application web
echo "🔨 Build de l'application web..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build de l'application web"
    exit 1
fi

echo "✅ Build web terminé"
echo ""

# Synchroniser avec Capacitor
echo "🔄 Synchronisation avec Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la synchronisation Capacitor"
    exit 1
fi

echo "✅ Synchronisation terminée"
echo ""

# Générer le bundle AAB
echo "📦 Génération du bundle AAB signé..."
cd android
./gradlew bundleRelease

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la génération du bundle"
    exit 1
fi

cd ..

BUNDLE_PATH="android/app/build/outputs/bundle/release/app-release.aab"

if [ -f "$BUNDLE_PATH" ]; then
    echo ""
    echo "✅ Bundle AAB généré avec succès !"
    echo ""
    echo "📁 Fichier : $BUNDLE_PATH"
    echo ""
    echo "📊 Taille : $(du -h "$BUNDLE_PATH" | cut -f1)"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "   1. Ouvrez Google Play Console"
    echo "   2. Créez une nouvelle application"
    echo "   3. Uploadez le fichier : $BUNDLE_PATH"
    echo "   4. Remplissez les informations de la fiche Play Store"
    echo "   5. Soumettez pour révision"
    echo ""
else
    echo "❌ Le bundle AAB n'a pas été généré"
    exit 1
fi

