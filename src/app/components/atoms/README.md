# 🧩 Bibliothèque de Composants Atomiques

## Vue d'ensemble

Cette bibliothèque contient tous les **composants atomiques réutilisables** de NuovaLingua. Chaque composant est **standalone**, suit les principes du design moderne, et peut être utilisé n'importe où dans l'application.

**Route de démonstration** : `/atoms-showcase`

---

## 📦 Composants Disponibles

### 1. **Button** (`app-button`)

Bouton moderne avec variants, tailles et états multiples.

#### Import
```typescript
import { ButtonComponent } from '@app/components/atoms';
```

#### Usage
```html
<app-button variant="primary" icon="add-outline" (clicked)="onAdd()">
  Ajouter
</app-button>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Style du bouton |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Taille du bouton |
| `icon` | `string` | - | Nom de l'icon Ionic |
| `iconSlot` | `'start' \| 'end'` | `'start'` | Position de l'icon |
| `disabled` | `boolean` | `false` | État désactivé |
| `loading` | `boolean` | `false` | État de chargement |
| `expand` | `'block' \| 'full'` | - | Expansion du bouton |

#### Events

| Event | Type | Description |
|-------|------|-------------|
| `clicked` | `void` | Émis au click |

---

### 2. **Card** (`app-card`)

Card moderne avec variants et états interactifs.

#### Import
```typescript
import { CardComponent } from '@app/components/atoms';
```

#### Usage
```html
<app-card variant="default" [interactive]="true" [selected]="isSelected" (cardClick)="onSelect()">
  <h3>Titre</h3>
  <p>Contenu de la card</p>
</app-card>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `'default' \| 'glass' \| 'elevated' \| 'outlined'` | `'default'` | Style de la card |
| `interactive` | `boolean` | `false` | Rendre la card cliquable |
| `selected` | `boolean` | `false` | État sélectionné |
| `loading` | `boolean` | `false` | État de chargement |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Padding interne |

#### Events

| Event | Type | Description |
|-------|------|-------------|
| `cardClick` | `void` | Émis au click (si interactive) |

---

### 3. **Badge** (`app-badge`)

Badge/Chip moderne avec couleurs et tailles multiples.

#### Import
```typescript
import { BadgeComponent } from '@app/components/atoms';
```

#### Usage
```html
<app-badge color="primary" icon="checkmark-circle">
  Completed
</app-badge>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'medium'` | `'primary'` | Couleur du badge |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Taille du badge |
| `icon` | `string` | - | Nom de l'icon Ionic |
| `iconOnly` | `boolean` | `false` | Afficher uniquement l'icon |
| `outlined` | `boolean` | `false` | Variante outlined |

---

### 4. **Skeleton Loader** (`app-skeleton-loader`)

Skeleton loader élégant pour les états de chargement.

#### Import
```typescript
import { SkeletonLoaderComponent } from '@app/components/atoms';
```

#### Usage
```html
<!-- Types prédéfinis -->
<app-skeleton-loader type="title"></app-skeleton-loader>
<app-skeleton-loader type="subtitle"></app-skeleton-loader>
<app-skeleton-loader type="text"></app-skeleton-loader>
<app-skeleton-loader type="circle"></app-skeleton-loader>

<!-- Custom -->
<app-skeleton-loader type="custom" width="200px" height="120px"></app-skeleton-loader>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `type` | `'text' \| 'title' \| 'subtitle' \| 'description' \| 'circle' \| 'rectangle' \| 'custom'` | `'text'` | Type de skeleton |
| `width` | `string` | - | Largeur custom |
| `height` | `string` | - | Hauteur custom |
| `circle` | `boolean` | `false` | Forme circulaire |

---

### 5. **Progress Bar** (`app-progress-bar`)

Barre de progression animée avec effet shimmer.

#### Import
```typescript
import { ProgressBarComponent } from '@app/components/atoms';
```

#### Usage
```html
<app-progress-bar 
  [value]="65" 
  [max]="100"
  color="primary"
  [showLabel]="true"
  [showPercentage]="true"
  label="Progression">
</app-progress-bar>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `value` | `number` | `0` | Valeur actuelle |
| `max` | `number` | `100` | Valeur maximale |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | Couleur |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Taille |
| `showLabel` | `boolean` | `false` | Afficher le label |
| `showPercentage` | `boolean` | `false` | Afficher le pourcentage |
| `label` | `string` | - | Texte du label |
| `shimmer` | `boolean` | `true` | Effet shimmer animé |

---

### 6. **Icon Wrapper** (`app-icon-wrapper`)

Wrapper d'icon avec fond coloré et variants multiples.

#### Import
```typescript
import { IconWrapperComponent } from '@app/components/atoms';
```

#### Usage
```html
<app-icon-wrapper 
  icon="rocket-outline" 
  color="primary" 
  variant="solid" 
  size="large"
  [interactive]="true">
</app-icon-wrapper>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `icon` | `string` | **requis** | Nom de l'icon Ionic |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'medium'` | `'primary'` | Couleur |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Taille |
| `variant` | `'solid' \| 'soft' \| 'outlined'` | `'solid'` | Style |
| `interactive` | `boolean` | `false` | Animation au hover |

---

### 7. **Empty State** (`app-empty-state`)

Composant d'état vide élégant avec action optionnelle.

#### Import
```typescript
import { EmptyStateComponent } from '@app/components/atoms';
```

#### Usage
```html
<app-empty-state
  icon="folder-open-outline"
  title="Aucun fichier"
  description="Vous n'avez pas encore ajouté de fichiers."
  [showAction]="true"
  actionLabel="Importer"
  actionIcon="add-outline"
  (action)="onImport()">
</app-empty-state>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `icon` | `string` | `'documents-outline'` | Nom de l'icon |
| `title` | `string` | `'Aucun élément'` | Titre |
| `description` | `string` | `'Commencez par...'` | Description |
| `actionLabel` | `string` | - | Label du bouton |
| `actionIcon` | `string` | - | Icon du bouton |
| `showAction` | `boolean` | `false` | Afficher le bouton |

#### Events

| Event | Type | Description |
|-------|------|-------------|
| `action` | `void` | Émis au click du bouton |

---

## 🎨 Exemples d'Utilisation

### Exemple 1 : Card Interactive avec Contenu

```html
<app-card variant="default" [interactive]="true" (cardClick)="selectItem(item)">
  <div class="card-header">
    <app-icon-wrapper icon="book-outline" color="primary" size="medium"></app-icon-wrapper>
    <app-badge color="success" icon="checkmark-circle">Completed</app-badge>
  </div>
  
  <h3>{{ item.title }}</h3>
  <p>{{ item.description }}</p>
  
  <app-progress-bar 
    [value]="item.progress" 
    color="primary"
    [showPercentage]="true">
  </app-progress-bar>
</app-card>
```

### Exemple 2 : Liste avec Skeleton Loaders

```html
<ng-container *ngIf="isLoading">
  <app-card *ngFor="let _ of [1,2,3]" [loading]="true">
    <div style="display: flex; gap: 16px;">
      <app-skeleton-loader type="circle"></app-skeleton-loader>
      <div style="flex: 1;">
        <app-skeleton-loader type="title"></app-skeleton-loader>
        <app-skeleton-loader type="text"></app-skeleton-loader>
      </div>
    </div>
  </app-card>
</ng-container>

<ng-container *ngIf="!isLoading">
  <app-card *ngFor="let item of items">
    <!-- Contenu réel -->
  </app-card>
</ng-container>
```

### Exemple 3 : Boutons d'Action

```html
<div class="actions">
  <app-button variant="primary" icon="add-outline" (clicked)="onCreate()">
    Créer
  </app-button>
  
  <app-button variant="outline" icon="download-outline" (clicked)="onExport()">
    Exporter
  </app-button>
  
  <app-button variant="ghost" icon="refresh-outline" (clicked)="onRefresh()">
    Rafraîchir
  </app-button>
  
  <app-button variant="danger" icon="trash-outline" [disabled]="!canDelete" (clicked)="onDelete()">
    Supprimer
  </app-button>
</div>
```

---

## 🚀 Best Practices

### 1. **Import Centralisé**

Utilisez l'index pour importer plusieurs composants :

```typescript
import { 
  ButtonComponent, 
  CardComponent, 
  BadgeComponent 
} from '@app/components/atoms';
```

### 2. **Composition**

Combinez les atoms pour créer des molécules :

```html
<app-card variant="default">
  <div class="stat-card">
    <app-icon-wrapper icon="trending-up" color="success" size="large"></app-icon-wrapper>
    <div>
      <h3>1,247</h3>
      <p>Mots appris</p>
    </div>
    <app-badge color="success" icon="arrow-up">+12%</app-badge>
  </div>
</app-card>
```

### 3. **États de Chargement**

Toujours utiliser des skeleton loaders plutôt que des spinners :

```html
<!-- ❌ Éviter -->
<ion-spinner *ngIf="loading"></ion-spinner>
<div *ngIf="!loading">{{ content }}</div>

<!-- ✅ Préférer -->
<app-skeleton-loader type="text" *ngIf="loading"></app-skeleton-loader>
<div *ngIf="!loading">{{ content }}</div>
```

### 4. **Cohérence des Couleurs**

Utilisez les couleurs de manière sémantique :

- **Primary** : Actions principales
- **Success** : Validations, réussites
- **Warning** : Alertes, attention
- **Danger** : Erreurs, suppressions
- **Secondary** : Actions secondaires
- **Medium** : Neutre, informations

---

## 📱 Responsive

Tous les composants sont **responsive** et s'adaptent automatiquement aux différentes tailles d'écran.

---

## 🌙 Dark Mode

Tous les composants supportent le **dark mode natif** et s'adaptent automatiquement selon les préférences système.

---

## ♿ Accessibilité

Tous les composants respectent les standards d'accessibilité :

- **Focus visible** sur tous les éléments interactifs
- **Contraste suffisant** (WCAG 2.1 AA)
- **Touch targets** de minimum 44px sur mobile
- **États disabled** clairs

---

## 🎯 Checklist d'Utilisation

Avant d'utiliser un atom dans votre composant :

- [ ] Importer le composant atom dans votre module/component
- [ ] Utiliser les props correctement typées
- [ ] Gérer les events émis si nécessaire
- [ ] Tester en light et dark mode
- [ ] Vérifier la responsivité
- [ ] Valider l'accessibilité

---

## 📚 Ressources

- **Démonstration live** : `/atoms-showcase`
- **Design showcase** : `/design-showcase`
- **Variables CSS** : `/src/theme/variables.scss`
- **Guide de design** : `/DESIGN_MODERNE_GUIDE.md`

---

## 🔄 Mise à Jour

Pour ajouter un nouvel atom :

1. Créer le dossier `/src/app/components/atoms/nouveau-composant/`
2. Créer les 3 fichiers : `.ts`, `.html`, `.scss`
3. Exporter depuis `/src/app/components/atoms/index.ts`
4. Ajouter un exemple dans `atoms-showcase`
5. Documenter dans ce README

---

**Fait avec ❤️ pour NuovaLingua**

