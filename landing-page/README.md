# Landing Page NuovaLingua

Page web de présentation moderne pour NuovaLingua, inspirée du design d'alephium.org et utilisant le design system de l'application.

## Structure

- `index.html` - Page principale
- `styles.css` - Styles avec le design system NuovaLingua
- `app.js` - Application Vue.js pour les interactions
- `images/` - Dossier pour les captures d'écran

## Utilisation

### Développement local

Ouvrez simplement `index.html` dans un navigateur ou utilisez un serveur local :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server -p 8000

# Avec PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

### Ajouter des captures d'écran

1. Placez vos captures d'écran dans le dossier `images/`
2. Modifiez `index.html` pour remplacer les placeholders par vos images :

```html
<div class="screenshot-card">
  <img src="images/screenshot-1.png" alt="Dictionnaire personnel">
</div>
```

## Personnalisation

Les couleurs et styles suivent le design system défini dans `src/theme/variables.scss` de l'application principale. Pour modifier les couleurs, éditez les variables CSS dans `styles.css`.

## Déploiement

Cette page peut être déployée sur :
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Tout autre hébergeur statique

Pour GitHub Pages, créez une branche `gh-pages` ou activez GitHub Pages dans les paramètres du repository.

