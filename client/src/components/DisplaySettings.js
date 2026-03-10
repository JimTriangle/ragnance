import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputSwitch } from 'primereact/inputswitch';

/**
 * Composant permettant de configurer l'affichage des sections d'une page.
 * Affiche un bouton qui ouvre un panneau avec des toggles pour chaque section.
 *
 * @param {{ sections: Array<{ key: string, label: string }>, visibility: Object, onToggle: Function }} props
 */
const DisplaySettings = ({ sections, visibility, onToggle }) => {
  const overlayRef = useRef(null);

  return (
    <>
      <Button
        icon="pi pi-eye"
        className="btn-icon-modern"
        onClick={(e) => overlayRef.current.toggle(e)}
        tooltip="Configurer l'affichage"
        tooltipOptions={{ position: 'left' }}
        aria-label="Configurer l'affichage des sections"
      />
      <OverlayPanel ref={overlayRef} style={{ width: '280px' }}>
        <div className="flex flex-column gap-3">
          <span className="font-bold text-sm text-500">Sections affichées</span>
          {sections.map((section) => (
            <div key={section.key} className="flex align-items-center justify-content-between">
              <label htmlFor={`toggle-${section.key}`} className="text-sm cursor-pointer">
                {section.label}
              </label>
              <InputSwitch
                inputId={`toggle-${section.key}`}
                checked={visibility[section.key] !== false}
                onChange={() => onToggle(section.key)}
              />
            </div>
          ))}
        </div>
      </OverlayPanel>
    </>
  );
};

export default DisplaySettings;
