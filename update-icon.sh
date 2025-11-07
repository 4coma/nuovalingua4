#!/bin/bash
# Script pour mettre à jour l'icône de l'application Android

set -e

ICON_SOURCE="$1"
ICON_DEST="resources/icon.png"

if [ -z "$ICON_SOURCE" ]; then
    echo "Usage: $0 <chemin_vers_icone.png>"
    echo ""
    echo "Exemple: $0 ~/Downloads/icon-italie.png"
    exit 1
fi

if [ ! -f "$ICON_SOURCE" ]; then
    echo "❌ Erreur: Le fichier '$ICON_SOURCE' n'existe pas"
    exit 1
fi

echo "🖼️  Copie de l'icône..."
cp "$ICON_SOURCE" "$ICON_DEST"
echo "✅ Icône copiée vers $ICON_DEST"

echo ""
echo "🔄 Génération des icônes Android avec @capacitor/assets..."
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#3880ff' --splashBackgroundColorDark '#000000' --android

echo ""
echo "✅ Icônes Android générées avec succès!"
echo ""
echo "📱 Les icônes ont été générées dans:"
echo "   - android/app/src/main/res/mipmap-*/ic_launcher*.png"
echo ""
echo "🔄 Synchronisation avec Capacitor..."
npx cap sync android

echo ""
echo "✅ Terminé! Vous pouvez maintenant rebuilder l'application."

