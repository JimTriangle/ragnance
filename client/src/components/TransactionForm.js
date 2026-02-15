import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SelectButton } from 'primereact/selectbutton';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { AutoComplete } from 'primereact/autocomplete';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import AmountInput from './AmountInput';

const TransactionForm = ({ onComplete, transactionToEdit = null, defaultDate = null }) => {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(null);
  const [type, setType] = useState(null);
  const [transactionType, setTransactionType] = useState('one-time');
  const [date, setDate] = useState(defaultDate || new Date());
  const [frequency, setFrequency] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProjectBudget, setSelectedProjectBudget] = useState(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [projectBudgets, setProjectBudgets] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [filteredLabels, setFilteredLabels] = useState([]);

  const transactionTypeOptions = [{ label: 'Ponctuel', value: 'one-time' }, { label: 'Récurrent', value: 'recurring' }];
  const frequencyOptions = [{ label: 'Annuel', value: 'yearly' }, { label: 'Mensuel', value: 'monthly' }, { label: 'Hebdomadaire', value: 'weekly' }];
  const transactionTypes = [{ label: 'Dépense', value: 'expense' }, { label: 'Revenu', value: 'income' }];

  useEffect(() => {
    api.get('/categories').then(response => setCategories(response.data));
    api.get('/project-budgets').then(response => setProjectBudgets(response.data));
    api.get('/transactions/labels').then(response => setAllLabels(response.data));
  }, []);

  useEffect(() => {
    if (transactionToEdit) {
      setLabel(transactionToEdit.label);
      setAmount(transactionToEdit.amount);
      setType(transactionToEdit.type);
      setTransactionType(transactionToEdit.transactionType);

      // On convertit les dates string "AAAA-MM-JJ" en objets Date pour le calendrier
      setDate(transactionToEdit.date ? new Date(transactionToEdit.date) : null);
      setStartDate(transactionToEdit.startDate ? new Date(transactionToEdit.startDate) : null);
      setEndDate(transactionToEdit.endDate ? new Date(transactionToEdit.endDate) : null);

      setFrequency(transactionToEdit.frequency);
      setSelectedCategories(transactionToEdit.Categories ? transactionToEdit.Categories.map(c => c.id) : []);
      setSelectedProjectBudget(transactionToEdit.ProjectBudgetId);
      setReminderEnabled(transactionToEdit.reminderEnabled || false);
      setReminderDaysBefore(transactionToEdit.reminderDaysBefore || 3);
    } else {
      setLabel(''); setAmount(null); setType(null); setTransactionType('one-time');
      setDate(defaultDate || new Date()); setFrequency(null); setStartDate(null); setEndDate(null);
      setSelectedCategories([]); setSelectedProjectBudget(null);
      setReminderEnabled(false); setReminderDaysBefore(3);
    }
  }, [transactionToEdit]);

  const searchLabel = (event) => {
    setTimeout(() => {
      let _filteredLabels;
      if (!event.query.trim().length) {
        _filteredLabels = [...allLabels];
      } else {
        _filteredLabels = allLabels.filter((label) => {
          return label.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }
      setFilteredLabels(_filteredLabels);
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedProjectBudget) {
      const budget = projectBudgets.find(b => b.id === selectedProjectBudget);
      const transactionDate = transactionType === 'one-time' ? date : startDate;
      if (budget && transactionDate && (new Date(transactionDate) < new Date(budget.startDate) || new Date(transactionDate) > new Date(budget.endDate))) {
        setError("La date de la transaction n'est pas dans la période du budget de projet sélectionné.");
        return;
      }
    }

    const sanitizedCategoryIds = Array.isArray(selectedCategories)
      ? Array.from(new Set(selectedCategories.filter(id => id !== null && id !== undefined))).map(id => Number(id)).filter(id => !Number.isNaN(id))
      : [];

    const normalizedProjectBudgetId = selectedProjectBudget === null || selectedProjectBudget === undefined
      ? null
      : Number(selectedProjectBudget);
      
    const transactionData = {
      label, amount, type, transactionType,
      categoryIds: sanitizedCategoryIds,
      ProjectBudgetId: Number.isNaN(normalizedProjectBudgetId) ? null : normalizedProjectBudgetId,
      reminderEnabled: type === 'expense' ? reminderEnabled : false,
      reminderDaysBefore: type === 'expense' && reminderEnabled ? reminderDaysBefore : null
    };

const formatDateForAPI = (d) => {
        if (!d) return null;
        // Cette méthode est la plus sûre pour obtenir AAAA-MM-JJ sans fuseau horaire
        const dateObj = new Date(d);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (transactionType === 'recurring') {
      if (!frequency || !startDate) {
        setError('Pour une transaction récurrente, la fréquence et la date de début sont requises.');
        return;
      }
      transactionData.frequency = frequency;
      transactionData.startDate = formatDateForAPI(startDate);
      transactionData.endDate = formatDateForAPI(endDate);
      if (frequency === 'monthly' || frequency === 'yearly' || frequency === 'weekly') {
        transactionData.dayOfMonth = new Date(startDate).getDate();
      } 
    } else {
      transactionData.date = formatDateForAPI(date);
    }

    try {
      if (transactionToEdit) {
        await api.put(`/transactions/${transactionToEdit.id}`, transactionData);
      } else {
        await api.post('/transactions', transactionData);
      }
      onComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-fluid">
      <div className="field text-center mb-4">
        <SelectButton value={transactionType} options={transactionTypeOptions} onChange={(e) => setTransactionType(e.value)} />
      </div>

      <div className="grid formgrid">
        <div className="field col-12 md:col-6"><span className="p-float-label"><AutoComplete value={label} suggestions={filteredLabels} completeMethod={searchLabel} onChange={(e) => setLabel(e.value)} id="label" dropdown /><label htmlFor="label">Libellé*</label></span></div>
        <div className="field col-12 md:col-3"><span className="p-float-label"><AmountInput id="amount" value={amount} onChange={(value) => setAmount(value)} /><label htmlFor="amount">Montant*</label></span></div>
        <div className="field col-12 md:col-3"><span className="p-float-label"><Dropdown id="type" value={type} options={transactionTypes} onChange={(e) => setType(e.value)} optionLabel="label" optionValue="value" placeholder="Type*" /><label htmlFor="type">Type*</label></span></div>

        <div className="field col-12">
          <span className="p-float-label">
            <MultiSelect
              id="category"
              value={selectedCategories}
              options={categories}
              onChange={(e) => setSelectedCategories(e.value)}
              optionLabel="name"
              optionValue="id"
              placeholder="Catégories"
              display="chip"
              className="p-inputtext-sm"
              filter // <-- AJOUT : Active le champ de recherche
              filterPlaceholder="Rechercher une catégorie" // <-- AJOUT : Texte d'aide dans le champ
            />
            <label htmlFor="category">Catégories</label>
          </span>
        </div>

        {type === 'expense' && (
          <div className="field col-12 mt-3"><span className="p-float-label"><Dropdown id="projectBudget" value={selectedProjectBudget} options={projectBudgets} onChange={(e) => setSelectedProjectBudget(e.value)} optionLabel="name" optionValue="id" placeholder="Associer à un budget de projet (optionnel)" showClear /><label htmlFor="projectBudget">Budget de Projet</label></span></div>
        )}

        {type === 'expense' && (
          <div className="field col-12 mt-3">
            <div className="flex align-items-center">
              <Checkbox
                inputId="reminderEnabled"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.checked)}
              />
              <label htmlFor="reminderEnabled" className="ml-2">Activer un rappel pour cette dépense</label>
            </div>
            {reminderEnabled && (
              <div className="field mt-2">
                <span className="p-float-label">
                  <InputNumber
                    id="reminderDaysBefore"
                    value={reminderDaysBefore}
                    onValueChange={(e) => setReminderDaysBefore(e.value)}
                    min={0}
                    max={365}
                    showButtons
                    suffix=" jour(s) avant"
                  />
                  <label htmlFor="reminderDaysBefore">Fréquence du rappel</label>
                </span>
              </div>
            )}
          </div>
        )}

        {transactionType === 'one-time' && (
          <div className="field col-12 mt-3"><span className="p-float-label"><Calendar id="date" value={date} onChange={(e) => setDate(e.value)} dateFormat="dd/mm/yy" placeholder="Date*" /><label htmlFor="date">Date*</label></span></div>
        )}

        {transactionType === 'recurring' && (
          <>
            <div className="field col-12 md:col-4 mt-3"><span className="p-float-label"><Dropdown id="frequency" value={frequency} options={frequencyOptions} onChange={(e) => setFrequency(e.value)} optionLabel="label" optionValue="value" placeholder="Fréquence*" /><label htmlFor="frequency">Fréquence*</label></span></div>
            <div className="field col-12 md:col-4 mt-3"><span className="p-float-label"><Calendar id="startDate" value={startDate} onChange={(e) => setStartDate(e.value)} dateFormat="dd/mm/yy" placeholder="Date de 1ère application*" /><label htmlFor="startDate">Date de 1ère application*</label></span></div>
            <div className="field col-12 md:col-4 mt-3"><span className="p-float-label"><Calendar id="endDate" value={endDate} onChange={(e) => setEndDate(e.value)} dateFormat="dd/mm/yy" placeholder="Date de fin (optionnel)" showClear /><label htmlFor="endDate">Date de fin (optionnel)</label></span></div>
          </>
        )}
      </div>

      <div className="field col-12 mt-3">{error && <Message severity="error" text={error} />}</div>
      <div className="field col-12"><Button type="submit" label={transactionToEdit ? 'Enregistrer' : 'Ajouter'} icon="pi pi-check" /></div>
    </form>
  );
};

export default TransactionForm;