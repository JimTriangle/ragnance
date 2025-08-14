import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SelectButton } from 'primereact/selectbutton';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { AutoComplete } from 'primereact/autocomplete';
import { MultiSelect } from 'primereact/multiselect';

const TransactionForm = ({ onComplete, transactionToEdit = null }) => {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(null);
  const [type, setType] = useState(null);
  const [transactionType, setTransactionType] = useState('one-time');
  const [date, setDate] = useState(new Date());
  const [frequency, setFrequency] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProjectBudget, setSelectedProjectBudget] = useState(null);
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
    } else {
      setLabel(''); setAmount(null); setType(null); setTransactionType('one-time'); 
      setDate(new Date()); setFrequency(null); setStartDate(null); setEndDate(null); 
      setSelectedCategories([]); setSelectedProjectBudget(null); 
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

    const transactionData = {
      label, amount, type, transactionType,
      categoryIds: selectedCategories,
      ProjectBudgetId: selectedProjectBudget
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
        <div className="field col-12 md:col-3"><span className="p-float-label"><InputNumber id="amount" value={amount} onValueChange={(e) => setAmount(e.value)} mode="currency" currency="EUR" locale="fr-FR" /><label htmlFor="amount">Montant*</label></span></div>
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
          <div className="field col-12"><span className="p-float-label"><Dropdown id="projectBudget" value={selectedProjectBudget} options={projectBudgets} onChange={(e) => setSelectedProjectBudget(e.value)} optionLabel="name" optionValue="id" placeholder="Associer à un budget de projet (optionnel)" showClear /><label htmlFor="projectBudget">Budget de Projet</label></span></div>
        )}

        {transactionType === 'one-time' && (
          <div className="field col-12"><span className="p-float-label"><Calendar id="date" value={date} onChange={(e) => setDate(e.value)} dateFormat="dd/mm/yy" placeholder="Date*" /><label htmlFor="date">Date*</label></span></div>
        )}

        {transactionType === 'recurring' && (
          <>
            <div className="field col-12 md:col-4"><span className="p-float-label"><Dropdown id="frequency" value={frequency} options={frequencyOptions} onChange={(e) => setFrequency(e.value)} optionLabel="label" optionValue="value" placeholder="Fréquence*" /><label htmlFor="frequency">Fréquence*</label></span></div>
            <div className="field col-12 md:col-4"><span className="p-float-label"><Calendar id="startDate" value={startDate} onChange={(e) => setStartDate(e.value)} dateFormat="dd/mm/yy" placeholder="Date de 1ère application*" /><label htmlFor="startDate">Date de 1ère application*</label></span></div>
            <div className="field col-12 md:col-4"><span className="p-float-label"><Calendar id="endDate" value={endDate} onChange={(e) => setEndDate(e.value)} dateFormat="dd/mm/yy" placeholder="Date de fin (optionnel)" showClear /><label htmlFor="endDate">Date de fin (optionnel)</label></span></div>
          </>
        )}
      </div>

      <div className="field col-12 mt-3">{error && <Message severity="error" text={error} />}</div>
      <div className="field col-12"><Button type="submit" label={transactionToEdit ? 'Enregistrer' : 'Ajouter'} icon="pi pi-check" /></div>
    </form>
  );
};

export default TransactionForm;