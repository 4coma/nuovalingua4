# Composants à Migrer vers le Nouveau Design Système

## ✅ Composants Déjà Migrés (Nouveau Design)

Ces composants utilisent déjà le nouveau design système avec les variables CSS et les styles modernes :

1. **category-selection** ✅
   - Utilise les variables du design system
   - Glassmorphism et animations modernes

2. **vocabulary-exercise** ✅
   - Cartes modernes avec variables CSS
   - Feedback visuel élégant

3. **comprehension-exercise** ✅
   - Interface moderne avec glassmorphism
   - Modals élégants

4. **comprehension-questions** ✅
   - Formulaire moderne
   - Audio player stylé

5. **design-showcase** ✅
   - Composant de démonstration du design system

---

## ❌ Composants à Migrer (Ancien Design)

Ces composants utilisent encore des valeurs hardcodées, des gradients fixes, ou des styles non conformes au nouveau design système :

### Composants Principaux

1. **preferences** ❌
   - Valeurs hardcodées : `16px`, `8px`, `18px`, `12px`, `14px`
   - Pas d'utilisation des variables `--ds-space-*`
   - Pas d'utilisation des variables `--color-*`

2. **word-pairs-game** ❌
   - Gradient hardcodé : `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
   - Valeurs hardcodées : multiples `px` fixes
   - Background sombre fixe au lieu d'utiliser les variables du design system

3. **discussion-active** ❌
   - Gradient hardcodé : `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
   - Valeurs hardcodées : `16px`, `20px`, `12px`, `8px`
   - Styles non conformes au design system

4. **personal-revision-setup** ❌
   - Gradient hardcodé : `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
   - Valeurs hardcodées : `16px`, `32px`, `12px`, `14px`
   - Couleurs hardcodées : `#ffffff`, `rgba(255, 255, 255, ...)`

5. **full-revision-setup** ❌
   - Valeurs hardcodées : `0.5rem`, `0.75rem`, `0.85rem`
   - Utilisation de `rem` au lieu du système 8px

### Composants Modaux

6. **new-words-modal** ❌
   - Valeurs hardcodées : `8px`, `4px`
   - Pas d'utilisation des variables du design system

7. **add-word** ❌
   - Valeurs hardcodées : `16px`, `10px`, `20px`, `8px`, `24px`
   - Pas d'utilisation des variables `--ds-space-*`

8. **add-text-modal** ❌
   - À vérifier (présent dans la liste mais contenu non analysé)

9. **text-preview-modal** ❌
   - À vérifier (présent dans la liste mais contenu non analysé)

10. **custom-instruction-modal** ❌
    - À vérifier (présent dans la liste mais contenu non analysé)

11. **theme-selection-modal** ❌
    - À vérifier (présent dans la liste mais contenu non analysé)

12. **word-list-modal** ❌
    - À vérifier (présent dans la liste mais contenu non analysé)

### Composants de Liste

13. **saved-texts-list** ❌
    - Couleur hardcodée : `#2dd36f !important`
    - `rgba(45, 211, 111, 0.15) !important`
    - Utilise certaines variables mais mélange avec valeurs hardcodées

14. **personal-dictionary-list** ❌
    - Valeurs hardcodées : `8px`, `20px`, `24px`, `16px`, `12px`, `40px`
    - Couleur hex hardcodée : `#8B9DC3`
    - Pas d'utilisation complète des variables du design system

15. **recent-words-list** ❌
    - Valeurs hardcodées : `8px`, `20px`, `24px`, `16px`, `12px`
    - Pas d'utilisation des variables `--ds-space-*`

16. **translatable-message** ❌
    - Couleur hardcodée : `#666`
    - Valeurs hardcodées : `8px`, `12px`, `4px`, `1px`
    - `rgba()` hardcodés multiples

### Composants Utilitaires

17. **discussion-context-selection** ❌
    - Valeurs hardcodées : `16px`, `8px`, `12px`, `40px`, `20px`
    - `rgba()` hardcodés dans `box-shadow`
    - Pas d'utilisation des variables `--ds-shadow-*`

18. **audio-player** ❌
    - Valeurs hardcodées : `8px`, `16px`, `48px`, `4px`, `24px`
    - Pas d'utilisation des variables du design system

19. **message-feedback** ❌
    - Valeurs hardcodées : `8px`, `4px`, `12px`, `14px`
    - `rgba()` hardcodés dans `box-shadow`
    - Pas d'utilisation des variables `--ds-shadow-*`

### Composants Tests / Showcase

20. **atoms-showcase** ❌
    - Composant de démonstration, probablement à migrer aussi

21. **audio-record-test** ❌
    - Composant de test, à vérifier

---

## 📋 Résumé

- **Total composants analysés** : ~32 composants
- **Composants migrés** : 10 composants ✅ (5 originaux + 5 de priorité haute)
- **Composants à migrer** : ~16 composants ❌

### Priorités de Migration

#### Priorité Haute (Composants Principaux)
1. preferences ✅ **MIGRÉ**
2. word-pairs-game ✅ **MIGRÉ**
3. discussion-active ✅ **MIGRÉ**
4. personal-revision-setup ✅ **MIGRÉ**
5. full-revision-setup ✅ **MIGRÉ**

#### Priorité Moyenne (Modaux Fréquents)
6. new-words-modal
7. add-word
8. saved-texts-list
9. personal-dictionary-list

#### Priorité Basse (Composants Utilitaires)
10. discussion-context-selection
11. audio-player
12. message-feedback
13. recent-words-list
14. translatable-message

---

## 🔍 Critères pour Identifier un Composant Migré

Un composant est considéré comme migré s'il utilise :

✅ Variables CSS du design system :
- `--ds-space-*` (au lieu de valeurs `px` hardcodées)
- `--color-*` (au lieu de couleurs hex/rgb hardcodées)
- `--ds-shadow-*` (au lieu de `box-shadow` hardcodés)
- `--ds-radius-*` (au lieu de `border-radius` hardcodés)
- `--ds-transition-*` (au lieu de transitions hardcodées)
- `--ds-font-size-*` (au lieu de `font-size` hardcodés)

✅ Classes utilitaires :
- `.stack-*` pour les espacements verticaux
- `.surface` pour les surfaces/cartes
- `.text-muted`, `.text-secondary` pour les textes

✅ Styles modernes :
- Glassmorphism (où approprié)
- Animations fluides
- Micro-interactions
- Ombres multicouches

---

## 📝 Notes

- Certains composants peuvent avoir un mélange d'ancien et nouveau design
- Les composants de test (`*-test`, `*-showcase`) peuvent être traités en dernier
- Certains modaux peuvent nécessiter une refonte plus importante que d'autres

