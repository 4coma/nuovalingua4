#!/bin/bash
# Script pour générer un APK signé pour téléchargement direct

echo "📦 Génération de l'APK signé pour téléchargement direct"
echo "========================================================"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier si le keystore existe (optionnel pour debug, obligatoire pour release signé)
KEYSTORE_PATH="android/app/nuovalingua-release-key.jks"
KEYSTORE_PROPERTIES="android/keystore.properties"

HAS_KEYSTORE=false
if [ -f "$KEYSTORE_PATH" ] && [ -f "$KEYSTORE_PROPERTIES" ]; then
    HAS_KEYSTORE=true
    echo "✅ Keystore trouvé - Génération d'un APK signé"
else
    echo "⚠️  Keystore non trouvé - Génération d'un APK debug (non signé)"
    echo "   Pour un APK signé, créez d'abord le keystore :"
    echo "   cd android && ./setup-keystore.sh"
    echo ""
fi

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

# Générer l'APK
echo "📦 Génération de l'APK..."
cd android

if [ "$HAS_KEYSTORE" = true ]; then
    echo "   → Build release signé"
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    echo "   → Build debug (non signé)"
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la génération de l'APK"
    exit 1
fi

cd ..

if [ -f "android/$APK_PATH" ]; then
    # Créer le dossier releases s'il n'existe pas
    mkdir -p releases
    
    # Copier l'APK avec un nom descriptif
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    if [ "$HAS_KEYSTORE" = true ]; then
        RELEASE_NAME="nuovalingua-release-$TIMESTAMP.apk"
    else
        RELEASE_NAME="nuovalingua-debug-$TIMESTAMP.apk"
    fi
    
    cp "android/$APK_PATH" "releases/$RELEASE_NAME"
    
    echo ""
    echo "✅ APK généré avec succès !"
    echo ""
    echo "📁 Fichier : releases/$RELEASE_NAME"
    echo "📊 Taille : $(du -h "releases/$RELEASE_NAME" | cut -f1)"
    echo ""
    
    if [ "$HAS_KEYSTORE" = true ]; then
        echo "✅ APK signé prêt pour distribution"
    else
        echo "⚠️  APK debug (non signé) - Pour tester uniquement"
    fi
    
    echo ""
    echo "🚀 Pour le rendre accessible sur le site :"
    echo "   1. Copiez releases/$RELEASE_NAME vers landing-page/downloads/"
    echo "   2. Renommez-le en nuovalingua-latest.apk"
    echo "   3. Le lien de téléchargement sur le site fonctionnera automatiquement"
    echo ""
else
    echo "❌ L'APK n'a pas été généré"
    exit 1
fi

