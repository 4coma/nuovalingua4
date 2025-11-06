#!/bin/bash
# Script pour prendre des captures d'écran de l'app NuovaLingua via ADB

echo "📱 Script de capture d'écran pour NuovaLingua"
echo "=============================================="
echo ""

# Vérifier si ADB est disponible
if ! command -v adb &> /dev/null; then
    echo "❌ ADB n'est pas installé ou n'est pas dans le PATH"
    echo "   Installez Android SDK Platform Tools pour utiliser ce script"
    exit 1
fi

# Vérifier si un appareil est connecté
if ! adb devices | grep -q "device$"; then
    echo "❌ Aucun appareil Android connecté"
    echo "   Connectez votre appareil via USB et activez le débogage USB"
    exit 1
fi

echo "✅ Appareil détecté"
echo ""
echo "Instructions :"
echo "1. Ouvrez l'app NuovaLingua sur votre appareil"
echo "2. Naviguez vers chaque écran demandé"
echo "3. Appuyez sur Entrée quand vous êtes prêt à capturer"
echo ""

# Créer le dossier images s'il n'existe pas
mkdir -p images

# Capture 1: Mode apprentissage par association
echo "📸 Capture 1/4 : Mode apprentissage par association"
echo "   → Allez dans 'Apprendre' → Sélectionnez une catégorie → Lancez le jeu d'association"
read -p "   Appuyez sur Entrée quand vous êtes prêt... "
adb shell screencap -p /sdcard/screenshot1.png
adb pull /sdcard/screenshot1.png images/mode-apprentissage-association.png
adb shell rm /sdcard/screenshot1.png
echo "   ✅ Capture sauvegardée : images/mode-apprentissage-association.png"
echo ""

# Capture 2: Compréhension écrite
echo "📸 Capture 2/4 : Compréhension écrite"
echo "   → Allez dans 'Apprendre' → Sélectionnez 'Compréhension écrite' → Lancez un exercice"
read -p "   Appuyez sur Entrée quand vous êtes prêt... "
adb shell screencap -p /sdcard/screenshot2.png
adb pull /sdcard/screenshot2.png images/comprehension-ecrite.png
adb shell rm /sdcard/screenshot2.png
echo "   ✅ Capture sauvegardée : images/comprehension-ecrite.png"
echo ""

# Capture 3: Conversation avec l'IA
echo "📸 Capture 3/4 : Conversation avec l'IA"
echo "   → Allez dans 'Discuter' → Lancez une conversation avec l'IA"
read -p "   Appuyez sur Entrée quand vous êtes prêt... "
adb shell screencap -p /sdcard/screenshot3.png
adb pull /sdcard/screenshot3.png images/conversation-ia.png
adb shell rm /sdcard/screenshot3.png
echo "   ✅ Capture sauvegardée : images/conversation-ia.png"
echo ""

# Capture 4: Dictionnaire personnel
echo "📸 Capture 4/4 : Mon dictionnaire personnel"
echo "   → Allez dans 'Mon dictionnaire personnel'"
read -p "   Appuyez sur Entrée quand vous êtes prêt... "
adb shell screencap -p /sdcard/screenshot4.png
adb pull /sdcard/screenshot4.png images/dictionnaire-personnel.png
adb shell rm /sdcard/screenshot4.png
echo "   ✅ Capture sauvegardée : images/dictionnaire-personnel.png"
echo ""

echo "🎉 Toutes les captures ont été prises avec succès !"
echo "   Vérifiez les images dans le dossier 'images/'"
echo ""
echo "💡 Astuce : Vous pouvez optimiser les images avec :"
echo "   optipng -o7 images/*.png"
echo "   ou"
echo "   mogrify -resize 1080x1920 -quality 85 images/*.png"

