import { useState, useCallback } from 'react';

/**
 * Hook pour gérer les préférences d'affichage des sections d'une page.
 * Les préférences sont persistées dans le localStorage.
 *
 * @param {string} pageKey - Clé unique pour la page (ex: 'dashboard', 'monthlyView')
 * @param {Object} defaultVisibility - Objet avec les clés de section et leur visibilité par défaut (true/false)
 * @returns {{ visibility: Object, toggleSection: Function, isVisible: Function }}
 */
const useDisplayPreferences = (pageKey, defaultVisibility) => {
  const storageKey = `displayPrefs_${pageKey}`;

  const [visibility, setVisibility] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new sections added after first save
        return { ...defaultVisibility, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return { ...defaultVisibility };
  });

  const toggleSection = useCallback((sectionKey) => {
    setVisibility(prev => {
      const updated = { ...prev, [sectionKey]: !prev[sectionKey] };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const isVisible = useCallback((sectionKey) => {
    return visibility[sectionKey] !== false;
  }, [visibility]);

  return { visibility, toggleSection, isVisible };
};

export default useDisplayPreferences;
