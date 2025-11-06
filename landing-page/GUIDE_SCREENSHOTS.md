# Guide pour ajouter les captures d'écran

## Étapes pour prendre les captures d'écran

### Sur Android (téléphone/tablette)

1. **Mode apprentissage par association** :
   - Ouvrez l'app NuovaLingua
   - Allez dans "Apprendre" → Sélectionnez une catégorie → Lancez le jeu d'association
   - Prenez une capture d'écran (généralement : Volume Bas + Power simultanément)
   - Nommez le fichier : `mode-apprentissage-association.png`

2. **Compréhension écrite** :
   - Allez dans "Apprendre" → Sélectionnez "Compréhension écrite"
   - Lancez un exercice de compréhension
   - Prenez une capture d'écran avec le texte visible
   - Nommez le fichier : `comprehension-ecrite.png`

3. **Conversation avec l'IA** :
   - Allez dans "Discuter"
   - Lancez une conversation avec l'IA
   - Prenez une capture d'écran montrant l'échange
   - Nommez le fichier : `conversation-ia.png`

4. **Mon dictionnaire personnel** :
   - Allez dans "Mon dictionnaire personnel"
   - Prenez une capture d'écran montrant la liste des mots
   - Nommez le fichier : `dictionnaire-personnel.png`

### Transférer les captures vers le projet

1. Connectez votre appareil Android à votre ordinateur
2. Copiez les 4 captures d'écran depuis votre appareil
3. Placez-les dans le dossier `landing-page/images/` avec les noms exacts :
   - `mode-apprentissage-association.png`
   - `comprehension-ecrite.png`
   - `conversation-ia.png`
   - `dictionnaire-personnel.png`

### Alternative : Utiliser ADB (Android Debug Bridge)

Si vous avez ADB installé et votre appareil en mode développeur :

```bash
# Prendre une capture d'écran directement depuis l'ordinateur
adb shell screencap -p /sdcard/screenshot1.png
adb pull /sdcard/screenshot1.png landing-page/images/mode-apprentissage-association.png

# Répétez pour les 4 captures
```

### Optimisation des images (optionnel)

Pour réduire la taille des fichiers et améliorer les performances :

```bash
# Avec ImageMagick (si installé)
cd landing-page/images
mogrify -resize 1080x1920 -quality 85 *.png

# Ou avec optipng
optipng -o7 *.png
```

## Vérification

Une fois les images ajoutées, ouvrez `landing-page/index.html` dans un navigateur pour vérifier que les captures s'affichent correctement.

