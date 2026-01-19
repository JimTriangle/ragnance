import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Hook React pour gérer les tours guidés avec Driver.js
 *
 * @param {string} tourId - Identifiant unique du tour (ex: "dashboard-tour")
 * @param {Array} steps - Étapes du tour avec format Driver.js
 * @param {boolean} autoStart - Démarrer automatiquement si première visite (défaut: true)
 * @param {Object} options - Options supplémentaires pour Driver.js
 * @returns {Object} - { startTour, hasSeenTour }
 */
const useTour = (tourId, steps, autoStart = true, options = {}) => {
  const driverRef = useRef(null);
  const hasSeenTourKey = `tour_seen_${tourId}`;

  // Vérifier si l'utilisateur a déjà vu ce tour
  const hasSeenTour = useCallback(() => {
    return localStorage.getItem(hasSeenTourKey) === 'true';
  }, [hasSeenTourKey]);

  // Marquer le tour comme vu
  const markTourAsSeen = useCallback(() => {
    localStorage.setItem(hasSeenTourKey, 'true');
  }, [hasSeenTourKey]);

  // Réinitialiser le tour (pour tests ou réinitialisation manuelle)
  const resetTour = useCallback(() => {
    localStorage.removeItem(hasSeenTourKey);
  }, [hasSeenTourKey]);

  // Démarrer le tour manuellement
  const startTour = useCallback(() => {
    if (!steps || steps.length === 0) {
      console.warn(`[useTour] Aucune étape définie pour le tour "${tourId}"`);
      return;
    }

    // Configuration par défaut de Driver.js
    const defaultOptions = {
      showProgress: true,
      progressText: '{{current}} sur {{total}}',
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Terminé',
      showButtons: ['next', 'previous'],
      popoverClass: 'custom-driver-popover',

      // Callbacks
      onDestroyed: () => {
        markTourAsSeen();
        console.log(`[useTour] Tour "${tourId}" terminé`);
      },
      onDestroyStarted: () => {
        if (!driverRef.current) return;

        // Si l'utilisateur a sauté le tour, on le marque quand même comme vu
        markTourAsSeen();

        // Nettoyer le driver
        driverRef.current.destroy();
        driverRef.current = null;
      },

      // Style et comportement
      animate: true,
      overlayOpacity: 0.75,
      smoothScroll: true,
      allowClose: true,
      disableActiveInteraction: false,

      // Padding autour de l'élément en surbrillance
      stagePadding: 10,
      stageRadius: 8,

      ...options
    };

    // Créer une nouvelle instance de driver
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver(defaultOptions);
    driverRef.current.setSteps(steps);
    driverRef.current.drive();

    console.log(`[useTour] Tour "${tourId}" démarré`);
  }, [tourId, steps, options, markTourAsSeen]);

  // Auto-démarrage si première visite
  useEffect(() => {
    if (autoStart && !hasSeenTour() && steps && steps.length > 0) {
      // Petit délai pour s'assurer que le DOM est complètement chargé
      const timer = setTimeout(() => {
        console.log(`[useTour] Auto-démarrage du tour "${tourId}"`);
        startTour();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [tourId, autoStart, hasSeenTour, startTour, steps]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  return {
    startTour,
    hasSeenTour: hasSeenTour(),
    resetTour
  };
};

export default useTour;
