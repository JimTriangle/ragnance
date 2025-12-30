import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import './AmountInput.css';

/**
 * Composant d'input pour saisir des montants optimisé pour mobile.
 * Permet de saisir facilement des montants avec décimales en tapant directement
 * les chiffres qui sont automatiquement formatés en euros et centimes.
 *
 * Exemple: taper "1234" → affiche "12,34 €"
 *
 * @param {Object} props
 * @param {number|null} props.value - Valeur en euros (nombre décimal)
 * @param {Function} props.onChange - Callback appelé quand la valeur change
 * @param {string} props.id - ID de l'input
 * @param {string} props.placeholder - Placeholder
 * @param {string} props.className - Classes CSS additionnelles
 */
const AmountInput = ({ value, onChange, id, placeholder, className = '' }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [cents, setCents] = useState(0);
  const inputRef = useRef(null);
  const isUpdatingFromProp = useRef(false);

  // Convertir la valeur en euros vers centimes
  useEffect(() => {
    if (isUpdatingFromProp.current) {
      isUpdatingFromProp.current = false;
      return;
    }

    if (value === null || value === undefined || value === '') {
      setCents(0);
      setDisplayValue('');
    } else {
      const newCents = Math.round(parseFloat(value) * 100);
      if (!isNaN(newCents) && newCents !== cents) {
        setCents(newCents);
        setDisplayValue(formatCentsToDisplay(newCents));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Formater les centimes en affichage "XX,XX €"
  const formatCentsToDisplay = (centsValue) => {
    if (centsValue === 0) return '';
    const euros = Math.floor(centsValue / 100);
    const centimes = Math.abs(centsValue % 100);
    const sign = centsValue < 0 ? '-' : '';
    return `${sign}${Math.abs(euros)},${centimes.toString().padStart(2, '0')} €`;
  };

  // Convertir les centimes en valeur numérique pour le parent
  const centsToValue = (centsValue) => {
    return centsValue / 100;
  };

  // Gérer la saisie clavier
  const handleKeyDown = (e) => {
    // Empêcher la saisie de caractères non numériques (sauf touches spéciales)
    if (
      !/^\d$/.test(e.key) && // Pas un chiffre
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'Tab' &&
      e.key !== 'Enter' &&
      !(e.key === 'a' && (e.ctrlKey || e.metaKey)) && // Ctrl+A / Cmd+A
      !(e.key === 'c' && (e.ctrlKey || e.metaKey)) && // Ctrl+C / Cmd+C
      !(e.key === 'v' && (e.ctrlKey || e.metaKey)) && // Ctrl+V / Cmd+V
      !(e.key === 'x' && (e.ctrlKey || e.metaKey)) // Ctrl+X / Cmd+X
    ) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const newCents = Math.floor(cents / 10);
      setCents(newCents);
      setDisplayValue(formatCentsToDisplay(newCents));

      isUpdatingFromProp.current = true;
      if (onChange) {
        onChange(newCents === 0 ? null : centsToValue(newCents));
      }
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const digit = parseInt(e.key);
      const newCents = cents * 10 + digit;

      // Limiter à un montant raisonnable (999999,99 €)
      if (newCents > 99999999) return;

      setCents(newCents);
      setDisplayValue(formatCentsToDisplay(newCents));

      isUpdatingFromProp.current = true;
      if (onChange) {
        onChange(centsToValue(newCents));
      }
    }
  };

  // Gérer le collage de texte
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Extraire les chiffres du texte collé
    const digits = pastedText.replace(/[^\d]/g, '');

    if (digits.length > 0) {
      let newCents = parseInt(digits);

      // Si le texte contient une virgule ou un point, on considère que c'est déjà formaté en euros
      if (pastedText.includes(',') || pastedText.includes('.')) {
        const numericValue = parseFloat(pastedText.replace(',', '.').replace(/[^\d.]/g, ''));
        if (!isNaN(numericValue)) {
          newCents = Math.round(numericValue * 100);
        }
      }

      // Limiter à un montant raisonnable
      if (newCents > 99999999) newCents = 99999999;

      setCents(newCents);
      setDisplayValue(formatCentsToDisplay(newCents));

      isUpdatingFromProp.current = true;
      if (onChange) {
        onChange(centsToValue(newCents));
      }
    }
  };

  // Gérer le focus: sélectionner tout le texte
  const handleFocus = (e) => {
    e.target.select();
  };

  // Gérer la perte de focus
  const handleBlur = () => {
    // Si le champ est vide, on met à jour le parent avec null
    if (cents === 0 && onChange) {
      isUpdatingFromProp.current = true;
      onChange(null);
    }
  };

  return (
    <div className="amount-input-wrapper">
      <InputText
        ref={inputRef}
        id={id}
        value={displayValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || '0,00 €'}
        className={`amount-input ${className}`}
        inputMode="numeric"
        autoComplete="off"
        readOnly={false}
      />
      {!displayValue && (
        <div className="amount-input-hint">
          Tapez les chiffres pour saisir le montant
        </div>
      )}
    </div>
  );
};

export default AmountInput;
