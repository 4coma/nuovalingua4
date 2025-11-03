# Topo sur les mécanismes de notifications - NuovaLingua

## Vue d'ensemble

L'application utilise le plugin **Capacitor Local Notifications** pour envoyer des notifications locales aux utilisateurs. Deux types de notifications quotidiennes sont disponibles :

1. **Notification de révision quotidienne** (ID: 1001)
2. **Notification de compréhension orale** (ID: 2001)

---

## Architecture générale

### Service principal : `NotificationService`

Le service `NotificationService` (`src/app/services/notification.service.ts`) centralise toute la logique de gestion des notifications.

### Composants clés :
- **LocalNotifications** (Capacitor) : Plugin natif pour les notifications
- **StorageService** : Stockage des paramètres et états
- **AppComponent** : Gestion des actions suite aux clics sur notifications

---

## Types de notifications

### 1. Notification de révision quotidienne

**ID** : `1001`  
**Action Type** : `DAILY_REVISION`  
**Action** : `start_revision`

#### Fonctionnalités :
- Rappel quotidien à une heure configurable (par défaut 18:30)
- Message personnalisable
- Message dynamique si des mots ont été ajoutés aujourd'hui
- Transmet les IDs des nouveaux mots ajoutés

#### Données transmises (`extra`) :
```typescript
{
  type: 'daily_reminder',
  action: 'start_revision',
  wordCount: number,              // Nombre de mots ajoutés aujourd'hui
  newWordIds: string[],           // IDs des nouveaux mots
  newWordsPreview: NotificationWordPreview[]  // Aperçu des 10 premiers mots
}
```

#### Cycle de vie :
1. **Programmation** : `scheduleDailyNotification()` calcule la prochaine occurrence
   - Si l'heure est passée aujourd'hui → programme pour demain
   - Répétition quotidienne activée (`repeats: true, every: 'day'`)

2. **Mise à jour dynamique** : Lors de l'ajout d'un mot via `PersonalDictionaryService.addWord()`
   - Détection automatique des mots ajoutés aujourd'hui
   - Mise à jour du message : "Vous avez ajouté X nouveaux mots aujourd'hui ! Il serait bon de les réviser. 🇮🇹"
   - Conservation des IDs pour la révision ciblée

3. **Réception** : Deux listeners dans `AppComponent.setupNotificationHandling()`
   - `localNotificationActionPerformed` : Clic sur la notification
   - `localNotificationReceived` : Réception quand l'app est fermée

4. **Action** : Lance `startPersonalDictionaryRevision()` avec les `newWordIds`

---

### 2. Notification de compréhension orale

**ID** : `2001`  
**Action Type** : `DAILY_COMPREHENSION`  
**Action** : `start_comprehension`

#### Fonctionnalités :
- Rappel quotidien à une heure configurable (par défaut 19:00)
- Message fixe : "Votre exercice d'écoute du jour est prêt !"
- Lance automatiquement une compréhension orale avec les 10 derniers mots ajoutés

#### Données transmises (`extra`) :
```typescript
{
  type: 'daily_comprehension',
  action: 'start_comprehension'
}
```

#### Cycle de vie :
1. **Programmation** : `scheduleDailyComprehensionNotification()`
2. **Action** : Lance `startDailyComprehension()` qui génère une compréhension orale avec les 10 derniers mots

---

## Flux de données

### 1. Initialisation

```typescript
// Dans AppComponent.ngOnInit()
notificationService.initialize()
  ↓
  requestPermissions()          // Demande permissions
  ↓
  setupNotificationActions()    // Configure les actions
  ↓
  scheduleDailyNotification()   // Programme si activée
  ↓
  scheduleDailyComprehensionNotification()  // Programme si activée
```

### 2. Ajout d'un mot au dictionnaire

```typescript
PersonalDictionaryService.addWord(word)
  ↓
  updateDailyNotification()  // Méthode privée
  ↓
  getWordsAddedToday()        // Récupère les mots d'aujourd'hui
  ↓
  notificationService.updateNotificationMessageWithTodayWords(
    count, ids, previews
  )
  ↓
  scheduleDailyNotification()  // Reprogramme avec nouveau message
```

### 3. Clic sur notification

```typescript
User clique sur notification
  ↓
LocalNotifications.addListener('localNotificationActionPerformed')
  ↓
AppComponent.setupNotificationHandling()
  ↓
Détermine l'action (start_revision ou start_comprehension)
  ↓
startPersonalDictionaryRevision({ newWordIds })
  ou
startDailyComprehension()
  ↓
showNewWordsPrompt(words)  // Modal avec liste des nouveaux mots
  ↓
Démarrage de la révision/compréhension
```

---

## État persistant

### `DailyNotificationState`

Stocké dans le localStorage avec la clé `dailyNotificationState` :

```typescript
{
  messageOverride: string | null,  // Message personnalisé si mots ajoutés
  wordCount: number,                // Nombre de mots ajoutés aujourd'hui
  newWordIds: string[],            // IDs des nouveaux mots
  newWordsPreview: NotificationWordPreview[]  // Aperçu (max 10)
}
```

**But** : Maintenir l'état entre les sessions pour :
- Reprogrammer la notification avec le bon message après redémarrage
- Conserver les IDs des nouveaux mots pour la révision ciblée

---

## Actions de notification

### Configuration initiale

Les actions sont enregistrées une fois au démarrage via `setupNotificationActions()` :

```typescript
LocalNotifications.registerActionTypes({
  types: [
    {
      id: 'DAILY_REVISION',
      actions: [{ id: 'start_revision', title: 'Commencer la révision' }]
    },
    {
      id: 'DAILY_COMPREHENSION',
      actions: [{ id: 'start_comprehension', title: 'Ouvrir la compréhension' }]
    }
  ]
})
```

### Utilisation

Chaque notification programmée spécifie son `actionTypeId`, ce qui permet au système de déterminer quelle action déclencher au clic.

---

## Gestion des permissions

### Vérification et demande

```typescript
// Demande initiale
requestPermissions() → LocalNotifications.requestPermissions()

// Vérification
checkPermissions() → LocalNotifications.checkPermissions()
// Retourne : { display: 'granted' | 'denied' | ... }
```

### Gestion des erreurs

- Si permissions refusées : log warning, notification non programmée
- Vérification des permissions avant chaque opération sensible

---

## Paramètres utilisateur

### Notification de révision

Stockés dans `notificationSettings` (localStorage) :
```typescript
{
  enabled: boolean,      // Activée/désactivée
  time: string,         // Format "HH:MM" (ex: "18:30")
  message: string       // Message par défaut
}
```

**Valeurs par défaut** :
- `enabled: false`
- `time: "18:30"`
- `message: "Il est temps de pratiquer votre italien ! 🇮🇹"`

### Notification de compréhension

Stockés dans `comprehensionNotificationSettings` :
```typescript
{
  enabled: boolean,
  time: string  // Format "HH:MM"
}
```

**Valeurs par défaut** :
- `enabled: false`
- `time: "19:00"`

---

## Méthodes principales

### NotificationService

#### Gestion de base
- `initialize()` : Initialisation complète du service
- `requestPermissions()` : Demande les permissions
- `toggleNotifications(enabled, time?, message?)` : Active/désactive
- `toggleComprehensionNotifications(enabled, time?)` : Active/désactive compréhension

#### Programmation
- `scheduleDailyNotification(time, message, extraData?)` : Programme la notification quotidienne
- `scheduleDailyComprehensionNotification(time)` : Programme compréhension
- `cancelDailyNotification()` : Annule la notification de révision
- `cancelDailyComprehensionNotification()` : Annule compréhension

#### Mise à jour dynamique
- `updateNotificationMessageWithTodayWords(count, ids, previews)` : Met à jour avec les nouveaux mots
- `updateNotificationTime(newTime)` : Change l'heure
- `updateNotificationMessage(newMessage)` : Change le message
- `resetNotificationMessage()` : Remet le message par défaut

#### Utilitaires
- `sendTestNotification()` : Envoie une notification de test immédiate
- `isSupported()` : Vérifie si les notifications sont supportées
- `checkPermissionsStatus()` : Vérifie et retourne le statut des permissions

---

## Intégration avec PersonalDictionaryService

### Mise à jour automatique

Lors de l'ajout d'un mot (`addWord()`), le service :
1. Ajoute le mot au dictionnaire
2. Appelle `updateDailyNotification()` en privé
3. Récupère les mots ajoutés aujourd'hui
4. Met à jour la notification via `notificationService.updateNotificationMessageWithTodayWords()`

### Détection des nouveaux mots

```typescript
getWordsAddedToday(): DictionaryWord[] {
  // Filtre les mots avec dateAdded entre aujourd'hui 00:00 et 23:59
  // Trie par date d'ajout (plus ancien en premier)
}
```

---

## Gestion des erreurs

### Stratégies

1. **Annulation avant reprogrammation** : 
   - Annule toujours l'ancienne notification avant d'en créer une nouvelle
   - Vérifie que l'annulation a fonctionné avant de continuer

2. **File d'attente de mise à jour** :
   - `notificationUpdateQueue` : Promise chaînée pour éviter les mises à jour concurrentes

3. **Gestion des permissions** :
   - Vérification avant chaque opération
   - Messages d'erreur explicites si permissions refusées

4. **Logs** :
   - Console.error pour les erreurs critiques
   - Console.warn pour les avertissements

---

## Flux utilisateur complet

### Scénario 1 : Ajout d'un mot et notification

1. Utilisateur ajoute un mot → `PersonalDictionaryService.addWord()`
2. Service détecte les mots d'aujourd'hui → `getWordsAddedToday()`
3. Notification mise à jour → Message personnalisé avec le nombre de mots
4. Notification programmée pour 18:30 (ou heure configurée)
5. À 18:30, notification reçue par l'utilisateur
6. Clic sur notification → Ouvre la modal `NewWordsModalComponent`
7. Utilisateur choisit "Commencer la révision"
8. Révision lancée avec uniquement les nouveaux mots du jour

### Scénario 2 : Notification de compréhension

1. Utilisateur active la notification de compréhension dans les préférences
2. Notification programmée pour 19:00 (ou heure configurée)
3. À 19:00, notification reçue
4. Clic sur notification → Lance `startDailyComprehension()`
5. Génération d'une compréhension orale avec les 10 derniers mots ajoutés
6. Exercice lancé automatiquement

---

## Points d'attention

### Limitations

1. **Persistance des notifications** : Les notifications programmées peuvent être perdues si :
   - L'app est désinstallée
   - Le système d'exploitation nettoie les notifications
   - L'app est réinitialisée

2. **Synchronisation** : L'état des nouveaux mots est recalculé à chaque ajout, mais dépend de l'heure système du device

3. **Permissions** : Les notifications nécessitent des permissions explicites sur Android et iOS

### Améliorations possibles

1. **Réprogrammation automatique** : Vérifier et reprogrammer les notifications au démarrage de l'app
2. **Synchronisation cloud** : Sauvegarder l'état des notifications pour restauration
3. **Notifications adaptatives** : Ajuster l'heure selon les habitudes de l'utilisateur
4. **Notifications de rappel** : Rappels supplémentaires si l'utilisateur n'a pas révisé

---

## Fichiers concernés

- `src/app/services/notification.service.ts` : Service principal
- `src/app/services/personal-dictionary.service.ts` : Intégration avec les mots
- `src/app/app.component.ts` : Gestion des actions et listeners
- `src/app/components/new-words-modal/new-words-modal.component.ts` : Modal d'affichage des nouveaux mots
- `src/app/components/preferences/preferences.component.ts` : Interface de configuration

---

## Exemples de code

### Programmer une notification

```typescript
await notificationService.scheduleDailyNotification(
  '18:30',
  'Il est temps de pratiquer votre italien ! 🇮🇹',
  {
    wordCount: 5,
    newWordIds: ['id1', 'id2', ...],
    newWordsPreview: [...]
  }
);
```

### Écouter les clics

```typescript
LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
  const extra = action.notification.extra;
  if (extra?.action === 'start_revision') {
    // Lancer la révision avec les nouveaux mots
    startPersonalDictionaryRevision({ newWordIds: extra.newWordIds });
  }
});
```

---

**Date de création** : 2025-01-XX  
**Dernière mise à jour** : 2025-01-XX

