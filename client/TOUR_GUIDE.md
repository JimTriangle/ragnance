# 📚 Guide d'utilisation du système de tours guidés

Ce document explique comment utiliser et étendre le système de tours guidés interactifs dans l'application.

## 🎯 Vue d'ensemble

Le système de tours guidés utilise **Driver.js** pour créer des tutoriels interactifs modernes avec :
- ✨ Zones en surbrillance (spotlight)
- 📱 Design responsive
- 💾 Mémorisation de la première visite
- 🔄 Possibilité de relancer à tout moment
- 🎨 Style intégré au thème de l'application

## 📂 Fichiers créés

```
client/src/
├── hooks/
│   └── useTour.js              # Hook React pour gérer les tours
├── components/
│   └── TourButton.js           # Bouton flottant "i" pour relancer le tour
└── styles/
    └── tour.css                # Styles personnalisés pour Driver.js
```

## 🚀 Utilisation rapide

### 1. Importer les dépendances

```javascript
import useTour from '../hooks/useTour';
import TourButton from '../components/TourButton';
import '../styles/tour.css';
```

### 2. Définir les étapes du tour

```javascript
const tourSteps = [
  {
    element: '[data-tour-id="mon-element"]',
    popover: {
      title: 'Titre de l\'étape',
      description: 'Description détaillée de cette section.',
      side: 'bottom',  // top, bottom, left, right
      align: 'center'  // start, center, end
    }
  },
  {
    element: '[data-tour-id="autre-element"]',
    popover: {
      title: 'Autre étape',
      description: 'Explication de cette fonctionnalité.',
      side: 'right',
      align: 'start'
    }
  },
  {
    // Étape finale sans élément ciblé
    popover: {
      title: 'C\'est terminé ! ✨',
      description: 'Vous pouvez relancer ce guide à tout moment.'
    }
  }
];
```

### 3. Utiliser le hook

```javascript
const { startTour } = useTour('ma-page-id', tourSteps, true);
```

**Paramètres :**
- `'ma-page-id'` : Identifiant unique du tour (pour localStorage)
- `tourSteps` : Tableau des étapes
- `true` : Auto-démarrage à la première visite (optionnel, défaut: true)

### 4. Ajouter les attributs data-tour-id dans le JSX

```javascript
<div data-tour-id="mon-element">
  <Card title="Mon composant">
    {/* Contenu */}
  </Card>
</div>
```

### 5. Ajouter le bouton de relance

```javascript
<TourButton
  onStartTour={startTour}
  tooltip="Revoir le guide"
/>
```

## 🎨 Personnalisation

### Options du bouton TourButton

```javascript
<TourButton
  onStartTour={startTour}
  tooltip="Texte du tooltip"
  position="bottom-right"  // bottom-right, bottom-left, top-right, top-left
  style={{ zIndex: 2000 }} // Styles CSS supplémentaires
/>
```

### Options avancées du tour

```javascript
const { startTour, hasSeenTour, resetTour } = useTour(
  'tour-id',
  tourSteps,
  true,
  {
    // Options personnalisées Driver.js
    animate: true,
    overlayOpacity: 0.75,
    padding: 10,
    smoothScroll: true,
    // Voir documentation Driver.js pour plus d'options
  }
);
```

### Méthodes retournées par useTour

- `startTour()` : Démarre/relance le tour manuellement
- `hasSeenTour` : Booléen indiquant si l'utilisateur a déjà vu ce tour
- `resetTour()` : Réinitialise le localStorage (pour tests)

## 📝 Exemple complet

Voir l'implémentation dans `/client/src/pages/DashboardPage.js` pour un exemple complet.

## 🎨 Personnalisation des styles

Modifier `/client/src/styles/tour.css` pour ajuster :
- Couleurs des popovers
- Styles des boutons
- Animation
- Thème clair/sombre
- Responsive mobile

## 🔧 Réinitialiser un tour (développement)

Pour tester à nouveau le tour :

```javascript
// Dans la console du navigateur
localStorage.removeItem('tour_seen_ma-page-id');
```

Ou programmatiquement :

```javascript
const { resetTour } = useTour('ma-page-id', tourSteps);
resetTour(); // Réinitialise le tour
```

## 📱 Pages à implémenter (suggestions)

- ✅ Dashboard (déjà fait)
- ⏳ Monthly View
- ⏳ Categories
- ⏳ Budgets
- ⏳ Expense Calculator
- ⏳ Trading Dashboard
- ⏳ Strategies
- ⏳ Backtests

## 📚 Ressources

- [Documentation Driver.js](https://driverjs.com/)
- [PrimeReact Components](https://primereact.org/)
- Hook personnalisé : `/client/src/hooks/useTour.js`

## 🐛 Dépannage

**Le tour ne démarre pas :**
- Vérifiez que les éléments avec `data-tour-id` existent dans le DOM
- Assurez-vous que le tour n'a pas déjà été vu (vérifier localStorage)
- Utilisez `resetTour()` pour réinitialiser

**Éléments mal positionnés :**
- Ajustez les propriétés `side` et `align` dans les étapes
- Modifiez le `padding` dans les options

**Styles incorrects :**
- Vérifiez que `tour.css` est bien importé
- Contrôlez les propriétés CSS custom properties (variables CSS)

---

**Créé le :** 2026-01-19
**Auteur :** Claude AI
**Version :** 1.0.0
