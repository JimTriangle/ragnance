import React from 'react';
import { Button } from 'primereact/button';

/**
 * Bouton pour relancer un tour guidé
 *
 * Affiche un bouton flottant avec une icône "i" (info) qui permet
 * à l'utilisateur de relancer le guide à tout moment.
 *
 * @param {Function} onStartTour - Fonction à appeler pour démarrer le tour
 * @param {string} tooltip - Texte du tooltip (défaut: "Revoir le guide")
 * @param {string} position - Position du bouton (défaut: "bottom-right")
 *                            Options: "bottom-right", "bottom-left", "top-right", "top-left"
 * @param {Object} style - Styles CSS supplémentaires
 */
const TourButton = ({
  onStartTour,
  tooltip = "Revoir le guide",
  position = "bottom-right",
  style = {}
}) => {
  // Positionnement selon la propriété position
  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '80px', right: '20px' },
    'top-left': { top: '80px', left: '20px' }
  };

  const buttonStyle = {
    position: 'fixed',
    zIndex: 1000,
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
    ...positionStyles[position],
    ...style
  };

  return (
    <Button
      icon="pi pi-info-circle"
      rounded
      severity="info"
      aria-label={tooltip}
      tooltip={tooltip}
      tooltipOptions={{ position: 'left' }}
      onClick={onStartTour}
      style={buttonStyle}
      className="tour-button"
    />
  );
};

export default TourButton;
