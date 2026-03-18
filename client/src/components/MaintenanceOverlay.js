import React, { useState, useEffect, useCallback } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

/**
 * Overlay plein écran affiché pendant les déploiements.
 * Bloque toutes les interactions utilisateur pour éviter la perte de saisie.
 * Se masque automatiquement quand le serveur redevient disponible.
 */
const MaintenanceOverlay = () => {
  const [visible, setVisible] = useState(false);

  const checkServerAvailability = useCallback(async () => {
    try {
      const baseURL = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5000/api'
        : `${window.location.origin}/api`;
      const res = await fetch(`${baseURL}/maintenance/status`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (!data.maintenance) {
          // Le serveur est de retour et la maintenance est terminée
          setVisible(false);
          window.location.reload();
        }
      }
    } catch {
      // Le serveur n'est pas encore disponible, on continue de poller
    }
  }, []);

  useEffect(() => {
    const handleMaintenance = () => setVisible(true);
    window.addEventListener('app:maintenance', handleMaintenance);
    return () => window.removeEventListener('app:maintenance', handleMaintenance);
  }, []);

  // Polling pour détecter la fin de la maintenance
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(checkServerAvailability, 5000);
    return () => clearInterval(interval);
  }, [visible, checkServerAvailability]);

  if (!visible) return null;

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          strokeWidth="4"
          animationDuration="1s"
        />
        <h2 style={{ margin: '1rem 0 0.5rem', color: 'var(--text-color, #333)' }}>
          Mise à jour en cours
        </h2>
        <p style={{ margin: 0, color: 'var(--text-color-secondary, #666)', textAlign: 'center', lineHeight: '1.5' }}>
          L'application est en cours de mise à jour.
          <br />
          Vos données sont en sécurité. La page se rechargera automatiquement
          dès que la mise à jour sera terminée.
        </p>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
  backdropFilter: 'blur(4px)',
};

const cardStyle = {
  background: 'var(--surface-card, #fff)',
  borderRadius: '12px',
  padding: '2.5rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '420px',
  width: '90%',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

export default MaintenanceOverlay;
