# Design System NuovaLingua

Ce design system fixe une base minimaliste et moderne inspirée des solutions comme Linear, Notion et Raycast : de grands espaces blancs, une typographie nette et une palette de couleurs réduite. Le but est d'offrir un vocabulaire commun et un ensemble de tokens réutilisables dans tout le projet.

- Les tokens CSS sont définis dans `src/theme/variables.scss` et chargés par `src/theme/design-system.scss`.
- L'ensemble est pensé pour être exploré, documenté et normatif : chaque composant doit consommer les variables plutôt que des valeurs magiques.

## Fondations visuelles

### Couleurs

| Nom | Variable CSS | Valeur | Usage recommandé |
| --- | --- | --- | --- |
| Primaire | `--ion-color-primary` / `--color-primary` | `#2563EB` | Actions principales, CTA, éléments interactifs clés |
| Secondaire | `--ion-color-secondary` | `#7C3AED` | Accentuation, badges, états actifs secondaires |
| Accent / Tertiaire | `--ion-color-tertiary` | `#F97316` | Callouts ponctuels, onboarding |
| Succès | `--ion-color-success` | `#16A34A` | Feedback positif, validations |
| Avertissement | `--ion-color-warning` | `#FACC15` | Etats intermédiaires ou préventifs |
| Danger | `--ion-color-danger` | `#EF4444` | Erreurs, alertes |
| Fond neutre | `--color-background` | `#F7F9FC` | Arrière-plan d'écran |
| Surface | `--color-surface` | `#FFFFFF` | Carte, modale, panneaux |
| Surface subtile | `--color-surface-subtle` | `#F1F5F9` | Sections secondaires, panneaux contrastés |
| Surface inverse | `--color-surface-inverse` | `#101828` | Barres sombres, hero inversé |
| Bordure subtile | `--color-border-subtle` | `#E4E7EC` | Contours discrets |
| Bordure forte | `--color-border-strong` | `#D0D5DD` | Séparateurs marqués, focus |
| Texte principal | `--color-text-primary` | `#101828` | Corps de texte |
| Texte secondaire | `--color-text-secondary` | `#475467` | Sous-titres, labels |
| Texte atténué | `--color-text-muted` | `#667085` | Métadonnées |
| Texte inversé | `--color-text-inverse` | `#F8FAFC` | Sur fond sombre |

> Les valeurs RGB correspondantes sont disponibles pour générer des opacités (`rgba(var(--ion-color-primary-rgb), 0.12)` par exemple).

### Typographie

- Famille principale : `Inter`, fallback système (`var(--ds-font-family-sans)`).
- Hiérarchie :
  - `h1` → `--ds-font-size-h1` (2rem) ; `line-height` serré `1.2` ; poids `600`.
  - `h2` → `--ds-font-size-h2` (1.5rem).
  - `h3` → `--ds-font-size-h3` (1.25rem).
  - `body` → `--ds-font-size-body` (1rem) ; `line-height` normal `1.5`.
  - `small` / légende → `--ds-font-size-caption` (0.75rem).
- Les classes utilitaires `.h1`, `.h2`, `.h3`, `.body`, `.body-sm`, `.caption` sont fournies par `design-system.scss` pour appliquer rapidement la bonne échelle.

### Espacements et rayons

L'échelle est basée sur un pas de 8px avec un demi-pas disponible pour les ajustements fins.

| Token | Valeur | Usage |
| --- | --- | --- |
| `--ds-space-3xs` | 4px | Micro-ajustements |
| `--ds-space-xxs` | 8px | Espacement interne minimal |
| `--ds-space-xs` | 16px | Espacement standard entre éléments |
| `--ds-space-sm` | 24px | Padding de cartes |
| `--ds-space-md` | 32px | Marges de sections |
| `--ds-space-lg` | 40px | Hero blocks |
| `--ds-space-xl` | 48px | Sections majeures |
| `--ds-space-xxl` | 64px | Respiration large |

Rayons disponibles : `--ds-radius-xs (6px)`, `--ds-radius-sm (8px)`, `--ds-radius-md (12px)`, `--ds-radius-lg (16px)`, `--ds-radius-full` pour les éléments pill.

## Composants de base

### Boutons

- `ion-button` est normalisé (padding, rayon, casse, hover) par `design-system.scss`.
- Variantes :
  - Primaire (`color="primary"`) pour l'action unique principale.
  - Secondaire (`color="secondary"`) pour une alternative.
  - Tonale / accent (`color="tertiary"`).
  - Outline : appliquer `fill="outline"` ou classe `.button-outline` → bord contrasté avec texte primaire.
  - Ghost : `fill="clear"` → texte secondaire sans ombre.
- Focus : ajouter `class="focus-ring"` lorsque le focus manuel est requis.

### Cartes (`ion-card` / `.surface`)

- Utiliser `ion-card` ou appliquer `.surface` pour des panneaux neutres.
- Padding recommandé : `var(--ds-space-sm)` à l'intérieur des cartes complexes.
- Titres et sous-titres utilisent les classes `.h3` ou `.body-lg` selon le niveau.

### Inputs et formulaires

- `ion-item` fournit les bordures et focus states via les tokens (`--color-border-subtle`, `--color-border-focus`).
- Placeholder et texte utilisent les couleurs neutres (`--color-text-muted`).
- Ajouter `.stack-sm` pour espacer verticalement des groupes d'inputs.

### Modales

- `ion-modal` hérite d'un rayon `--ds-radius-lg` et d'une ombre douce.
- Prévoir un header compact (`padding-inline: var(--ds-space-xxs)`) et un footer aligné à droite pour les actions.

### Composants utilitaires

- Badges → classe `.badge` (fond primaire translucide + texte bleu).
- Surfaces accentuées → `.surface-accent` pour mettre en avant une section au sein d'une carte.
- Layout → `.ds-container`, `.stack-xs/sm/md` pour gérer les espacements verticaux cohérents.

## Patterns de navigation

### Menu latéral (`ion-menu`)

- Largeur : automatique, mais limitée par `--ds-space` et `box-shadow` pour créer une séparation douce.
- Palette : fond `--color-surface`, textes `--color-text-primary`, icônes primaires pour l'état actif.
- Sélecteur actif → utiliser la couleur primaire avec une opacité de 12–16% pour rester léger.

### Tabs (`ion-tabs`)

- `ion-tab-bar` arrondi (`--ds-radius-full`) et fond clair.
- Tabs sélectionnées : couleur primaire (`--ion-color-primary`), non sélectionnées : `--color-text-muted`.

### Header fixe (`ion-header`)

- Fond blanc avec ombre légère (`--ds-shadow-xs`).
- Utiliser `.ds-container` à l'intérieur pour aligner le contenu sur la grille principale.
- Les actions (bouton menu, options) suivent les règles de boutons ghost.

### Contenu plein écran

- `ion-content` reste sur fond `--color-background`.
- Les sections internes utilisent `.stack-md` pour gérer le rythme vertical.

## Mise en conformité des composants

- Les fichiers existants sont progressivement alignés :
  - Tokens globaux : `src/theme/variables.scss`.
  - Utilitaires et overrides : `src/theme/design-system.scss`.
  - Exemple de conversion réalisée sur `src/app/components/category-selection/category-selection.component.scss` (remplacement des hexadécimaux par des variables).
- Lors de la création ou de la refonte d'un composant :
  1. Identifier la variante (surface claire, accentuée, inverse).
  2. Piocher dans la palette de tokens ; ne pas introduire de nouvelle couleur sans mise à jour du tableau ci-dessus.
  3. Utiliser les utilitaires `.stack-*`, `.surface`, `.text-muted` pour assurer la cohérence.

## Check-list designers & devs

- [ ] Toutes les couleurs proviennent des variables définies.
- [ ] L'espacement répond à l'échelle 8px (`--ds-space-*`).
- [ ] Les tailles de police utilisent les classes utilitaires ou les variables `--ds-font-size-*`.
- [ ] Les composants Ionics (`ion-button`, `ion-card`, `ion-item`, `ion-modal`) ne sont plus surchargés individuellement sauf cas particulier.
- [ ] Les patterns de navigation reprennent les sections ci-dessus.

En suivant ces règles, NuovaLingua bénéficie d'une base visuelle claire, évolutive et facile à faire vivre sur web comme mobile.
