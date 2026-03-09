# Plan d'execution - Mise en ligne Web de NuovaLingua

Date: 2026-03-03
Statut: Ready for execution

## Objectif
Publier une version web fiable de l'application (pas uniquement la landing page), avec un parcours utilisateur stable, une gestion propre des fonctionnalités non supportées en navigateur, et un déploiement reproductible.

## Contraintes observees dans le code actuel
- Le build Angular web est OK (`npm run build`).
- Firebase Hosting publie actuellement `landing-page` (pas `www`).
- L'extraction URL utilise un service simule dans l'UI.
- Les notifications web sont basees sur `setTimeout` (non persistantes apres refresh).
- Les appels OpenAI sont faits cote client avec cle utilisateur (BYOK).
- Config Playwright desynchronisee avec le port de dev server.

## Phase P0 - Go/No-Go technique (priorite immediate)

### Ticket P0.1 - Cadrage scope web
- Decision explicite: version "Web App" (Ionic/Angular) + compat desktop/mobile web.
- Decision explicite: politique IA (BYOK maintenu ou proxy backend).
- Livrable: note de cadrage de 1 page.
- DoD: decisions signees + impacts UX/tech documentes.

### Ticket P0.2 - Stabiliser pipeline local
- Aligner Playwright avec le port reel du dev server.
- Verifier `npm run build`, `npm run lint`, `npm run test:e2e` sur Chromium.
- DoD: un run complet passe en local sans contournement.

### Ticket P0.3 - Activer un vrai target Hosting pour l'app
- Ajouter un target Firebase dedie app web (public = `www`).
- Conserver le target existant pour `landing-page`.
- Ajouter script(s) npm de deploiement clairs (`build:web`, `deploy:web`).
- DoD: URL web app accessible et routage SPA fonctionnel.

### Ticket P0.4 - Matrice compatibilite navigateur
- Lister pour chaque feature: supportee / fallback / desactivee en web.
- Cibles mini: Chrome, Firefox, Safari recents.
- DoD: matrice publiee et partagee avec warnings UX associes.

## Phase P1 - Fiabilite produit (avant ouverture publique)

### Ticket P1.1 - Extraction URL reelle
- Remplacer le service simule par un chemin backend reel.
- Unifier protocole frontend/backend (HTTP propre ou callable SDK coherent).
- Ajouter gestion d'erreurs robuste (timeout, CORS, URL invalide, contenu vide).
- DoD: extraction operationnelle sur un corpus de sites tests.

### Ticket P1.2 - Backend IA minimal (si mode non-BYOK)
- Creer endpoint serveur pour appels OpenAI (rate limit + logs + budget guardrails).
- Masquer completement les secrets serveur du frontend.
- DoD: aucune cle serveur exposee dans bundle/reseau client.

### Ticket P1.3 - UX des features "mobile-like" en web
- Notifications: expliquer limites web et ajouter UX de fallback explicite.
- Audio/micro: messages de permissions et etats d'erreur normalises.
- DoD: aucun parcours bloquant sans message utilisateur clair.

### Ticket P1.4 - Securite baseline web
- CSP, X-Frame-Options, Referrer-Policy, HSTS (au niveau hosting/CDN).
- Revue stockage local des donnees sensibles.
- DoD: checklist securite v1 validee.

## Phase P2 - Industrialisation

### Ticket P2.1 - CI/CD
- CI: lint + build + e2e smoke sur PR.
- CD: deploiement automatique staging, prod manuelle avec approbation.
- DoD: pipeline verte et reproductible.

### Ticket P2.2 - Observabilite
- Capturer erreurs frontend (Sentry ou equivalent).
- Dashboard minimal: erreurs JS, taux de succes extraction, latence API.
- DoD: alertes configurees sur incidents critiques.

### Ticket P2.3 - Performance et PWA
- Budget de performance web (bundle initial, LCP).
- Option PWA (offline partiel, installable) si utile produit.
- DoD: score Lighthouse cible atteint (a definir en P0).

## Ordre d'execution recommande
1. P0.1
2. P0.2
3. P0.3
4. P0.4
5. P1.1
6. P1.3
7. P1.2
8. P1.4
9. P2.x

## Risques majeurs a traiter tot
- Risque cout/abus API si ouverture web sans backend de controle.
- Risque confusion produit si extraction URL reste simulee en prod.
- Risque UX sur notifications web (non persistantes nativement selon contexte navigateur).

## Definition of Done globale
- URL web publique stable.
- Parcours coeur (apprendre, comprehension, conversation, sauvegarde) teste sur 3 navigateurs.
- Aucun secret serveur expose.
- Deploiement scriptable et rollback documente.
