#!/bin/bash
# Script pour créer le keystore et configurer la signature pour Google Play

echo "🔐 Configuration du keystore pour NuovaLingua"
echo "=============================================="
echo ""

# Vérifier si keytool est disponible
if ! command -v keytool &> /dev/null; then
    echo "❌ keytool n'est pas installé ou n'est pas dans le PATH"
    echo "   Installez Java JDK pour utiliser cet outil"
    exit 1
fi

KEYSTORE_PATH="android/app/nuovalingua-release-key.jks"
KEYSTORE_PROPERTIES="android/keystore.properties"

# Vérifier si le keystore existe déjà
if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️  Un keystore existe déjà à : $KEYSTORE_PATH"
    read -p "Voulez-vous le remplacer ? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "Annulé."
        exit 0
    fi
fi

echo "📝 Création du keystore..."
echo ""
echo "Vous allez être invité à saisir :"
echo "  - Un mot de passe pour le keystore (à conserver précieusement)"
echo "  - Un mot de passe pour la clé (peut être le même)"
echo "  - Vos informations personnelles"
echo ""

# Créer le keystore
keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias nuovalingua

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la création du keystore"
    exit 1
fi

echo ""
echo "✅ Keystore créé avec succès !"
echo ""

# Demander les mots de passe pour créer keystore.properties
echo "📝 Configuration du fichier keystore.properties..."
echo ""

read -sp "Mot de passe du keystore : " STORE_PASSWORD
echo ""
read -sp "Mot de passe de la clé (alias) : " KEY_PASSWORD
echo ""

# Créer le fichier keystore.properties
cat > "$KEYSTORE_PROPERTIES" << EOF
storePassword=$STORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=nuovalingua
storeFile=app/nuovalingua-release-key.jks
EOF

echo ""
echo "✅ Fichier keystore.properties créé"
echo ""
echo "⚠️  IMPORTANT :"
echo "   - Le fichier keystore.properties est dans .gitignore et ne sera pas commité"
echo "   - Sauvegardez le fichier $KEYSTORE_PATH dans un endroit sûr"
echo "   - Notez les mots de passe dans un gestionnaire de mots de passe"
echo "   - Sans le keystore, vous ne pourrez plus mettre à jour l'application sur Google Play"
echo ""
echo "📦 Pour générer le bundle AAB signé :"
echo "   cd android && ./gradlew bundleRelease"
echo ""

