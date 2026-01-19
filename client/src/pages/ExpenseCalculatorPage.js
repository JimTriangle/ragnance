import React, { useState, useMemo, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AmountInput from '../components/AmountInput';

const ExpenseCalculatorPage = () => {
  // Fonction helper pour obtenir le mois courant au format YYYY-MM
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Fonction helper pour formater l'affichage du mois
  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  // Fonction pour obtenir le mois précédent
  const getPreviousMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Fonction pour obtenir le mois suivant
  const getNextMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [personDialog, setPersonDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [currentPerson, setCurrentPerson] = useState({ name: '', income: 0 });
  const [currentExpense, setCurrentExpense] = useState({ name: '', amount: 0 });
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Charger les données sauvegardées pour le mois sélectionné
  useEffect(() => {
    const storageKey = `expenseCalculator_${selectedMonth}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setPeople(data.people || []);
        setExpenses(data.expenses || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setPeople([]);
        setExpenses([]);
      }
    } else {
      // Si aucune donnée pour ce mois, on réinitialise
      setPeople([]);
      setExpenses([]);
    }
  }, [selectedMonth]);

  // Migration unique des anciennes données au format mensuel (au premier chargement)
  useEffect(() => {
    const oldPeopleKey = 'expenseCalculator_people';
    const oldExpensesKey = 'expenseCalculator_expenses';
    const migrationDoneKey = 'expenseCalculator_migrated';

    // Vérifier si la migration n'a pas déjà été faite
    if (!localStorage.getItem(migrationDoneKey)) {
      const oldPeople = localStorage.getItem(oldPeopleKey);
      const oldExpenses = localStorage.getItem(oldExpensesKey);

      if (oldPeople || oldExpenses) {
        try {
          const currentMonthKey = getCurrentMonth();
          const newStorageKey = `expenseCalculator_${currentMonthKey}`;

          const migratedData = {
            people: oldPeople ? JSON.parse(oldPeople) : [],
            expenses: oldExpenses ? JSON.parse(oldExpenses) : []
          };

          localStorage.setItem(newStorageKey, JSON.stringify(migratedData));

          // Supprimer les anciennes clés
          localStorage.removeItem(oldPeopleKey);
          localStorage.removeItem(oldExpensesKey);

          // Marquer la migration comme terminée
          localStorage.setItem(migrationDoneKey, 'true');

          console.log('Migration des données vers le format mensuel réussie');
        } catch (error) {
          console.error('Erreur lors de la migration des données:', error);
        }
      } else {
        // Pas de données à migrer, marquer quand même comme fait
        localStorage.setItem(migrationDoneKey, 'true');
      }
    }
  }, []);

  // Sauvegarder les données quand elles changent
  useEffect(() => {
    const storageKey = `expenseCalculator_${selectedMonth}`;
    const data = { people, expenses };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [people, expenses, selectedMonth]);

  // Calculer le revenu total
  const totalIncome = useMemo(() => {
    return people.reduce((sum, person) => sum + person.income, 0);
  }, [people]);

  // Calculer les pourcentages de revenus
  const peopleWithPercentages = useMemo(() => {
    return people.map(person => ({
      ...person,
      percentage: totalIncome > 0 ? (person.income / totalIncome) * 100 : 0
    }));
  }, [people, totalIncome]);

  // Calculer le total des charges
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Calculer la répartition des charges par personne
  const expenseDistribution = useMemo(() => {
    return expenses.map(expense => {
      const shares = peopleWithPercentages.map(person => ({
        personId: person.id,
        personName: person.name,
        amount: (expense.amount * person.percentage) / 100
      }));
      return { ...expense, shares };
    });
  }, [expenses, peopleWithPercentages]);

  // Calculer le total des charges par personne
  const totalPerPerson = useMemo(() => {
    return peopleWithPercentages.map(person => {
      const total = expenseDistribution.reduce((sum, expense) => {
        const share = expense.shares.find(s => s.personId === person.id);
        return sum + (share ? share.amount : 0);
      }, 0);
      return { ...person, totalExpenses: total };
    });
  }, [peopleWithPercentages, expenseDistribution]);

  // Fonctions pour ajouter/modifier/supprimer des personnes
  const savePerson = () => {
    if (currentPerson.name && currentPerson.income > 0) {
      if (editingPersonId) {
        // Mode édition
        setPeople(people.map(p => p.id === editingPersonId ? { ...currentPerson, id: editingPersonId } : p));
        setEditingPersonId(null);
      } else {
        // Mode ajout
        setPeople([...people, { ...currentPerson, id: Date.now() }]);
      }
      setCurrentPerson({ name: '', income: 0 });
      setPersonDialog(false);
    }
  };

  const editPerson = (person) => {
    setCurrentPerson({ name: person.name, income: person.income });
    setEditingPersonId(person.id);
    setPersonDialog(true);
  };

  const removePerson = (id) => {
    setPeople(people.filter(p => p.id !== id));
  };

  const openPersonDialog = () => {
    setCurrentPerson({ name: '', income: 0 });
    setEditingPersonId(null);
    setPersonDialog(true);
  };

  // Fonctions pour ajouter/modifier/supprimer des charges
  const saveExpense = () => {
    if (currentExpense.name && currentExpense.amount > 0) {
      if (editingExpenseId) {
        // Mode édition
        setExpenses(expenses.map(e => e.id === editingExpenseId ? { ...currentExpense, id: editingExpenseId } : e));
        setEditingExpenseId(null);
      } else {
        // Mode ajout
        setExpenses([...expenses, { ...currentExpense, id: Date.now() }]);
      }
      setCurrentExpense({ name: '', amount: 0 });
      setExpenseDialog(false);
    }
  };

  const editExpense = (expense) => {
    setCurrentExpense({ name: expense.name, amount: expense.amount });
    setEditingExpenseId(expense.id);
    setExpenseDialog(true);
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const openExpenseDialog = () => {
    setCurrentExpense({ name: '', amount: 0 });
    setEditingExpenseId(null);
    setExpenseDialog(true);
  };

  // Fonctions de navigation entre les mois
  const goToPreviousMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const goToNextMonth = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(getCurrentMonth());
  };

  // Fonction pour copier les données du mois précédent
  const copyFromPreviousMonth = () => {
    const previousMonth = getPreviousMonth(selectedMonth);
    const previousStorageKey = `expenseCalculator_${previousMonth}`;
    const previousData = localStorage.getItem(previousStorageKey);

    if (previousData) {
      try {
        const data = JSON.parse(previousData);
        setPeople(data.people || []);
        setExpenses(data.expenses || []);
      } catch (error) {
        console.error('Erreur lors de la copie des données du mois précédent:', error);
      }
    }
  };

  // Vérifier si le mois précédent a des données
  const hasPreviousMonthData = () => {
    const previousMonth = getPreviousMonth(selectedMonth);
    const previousStorageKey = `expenseCalculator_${previousMonth}`;
    return localStorage.getItem(previousStorageKey) !== null;
  };

  return (
    <div className="p-3">
      <h1 className="text-2xl font-bold mb-3">Calculateur de répartition des charges</h1>

      {/* Navigation mensuelle */}
      <Card className="mb-3">
        <div className="flex justify-content-between align-items-center gap-3 flex-wrap">
          <div className="flex align-items-center gap-2">
            <Button
              icon="pi pi-chevron-left"
              onClick={goToPreviousMonth}
              className="p-button-rounded"
              tooltip="Mois précédent"
            />
            <h2 className="text-xl font-bold m-0" style={{ minWidth: '200px', textAlign: 'center' }}>
              {formatMonthDisplay(selectedMonth)}
            </h2>
            <Button
              icon="pi pi-chevron-right"
              onClick={goToNextMonth}
              className="p-button-rounded"
              tooltip="Mois suivant"
            />
            {selectedMonth !== getCurrentMonth() && (
              <Button
                label="Aujourd'hui"
                icon="pi pi-calendar"
                onClick={goToCurrentMonth}
                className="p-button-outlined"
              />
            )}
          </div>
          {hasPreviousMonthData() && (
            <Button
              label="Copier du mois précédent"
              icon="pi pi-copy"
              onClick={copyFromPreviousMonth}
              className="p-button-outlined p-button-secondary"
              tooltip={`Copier les données de ${formatMonthDisplay(getPreviousMonth(selectedMonth))}`}
            />
          )}
        </div>
      </Card>

      {/* Grille à deux colonnes pour Personnes et Charges */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Section Personnes */}
        <Card title="Personnes et revenus">
          <Button
            label="Ajouter une personne"
            icon="pi pi-plus"
            onClick={openPersonDialog}
            className="mb-2"
          />

          {people.length > 0 && (
            <DataTable value={totalPerPerson} size="small" className="mb-2">
              <Column field="name" header="Nom" />
              <Column
                field="income"
                header="Revenu mensuel"
                body={(rowData) => `${rowData.income.toFixed(2)} €`}
              />
              <Column
                field="percentage"
                header="% du revenu total"
                body={(rowData) => `${rowData.percentage.toFixed(2)} %`}
              />
              <Column
                field="totalExpenses"
                header="Total charges"
                body={(rowData) => `${rowData.totalExpenses.toFixed(2)} €`}
              />
              <Column
                body={(rowData) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-pencil"
                      onClick={() => editPerson(rowData)}
                      className="p-button-rounded p-button-text p-button-info"
                      tooltip="Modifier"
                    />
                    <Button
                      icon="pi pi-trash"
                      onClick={() => removePerson(rowData.id)}
                      className="p-button-rounded p-button-text p-button-danger"
                      tooltip="Supprimer"
                    />
                  </div>
                )}
              />
            </DataTable>
          )}

          {people.length > 0 && (
            <div className="mt-2 text-lg font-bold">
              Revenu total : {totalIncome.toFixed(2)} €
            </div>
          )}
        </Card>

        {/* Section Charges */}
        <Card title="Charges mensuelles">
          <Button
            label="Ajouter une charge"
            icon="pi pi-plus"
            onClick={openExpenseDialog}
            className="mb-2"
          />

          {expenses.length > 0 && (
            <>
              <DataTable value={expenses} size="small" className="mb-2">
                <Column field="name" header="Charge" />
                <Column
                  field="amount"
                  header="Montant"
                  body={(rowData) => `${rowData.amount.toFixed(2)} €`}
                />
                <Column
                  body={(rowData) => (
                    <div className="flex gap-2">
                      <Button
                        icon="pi pi-pencil"
                        onClick={() => editExpense(rowData)}
                        className="p-button-rounded p-button-text p-button-info"
                        tooltip="Modifier"
                      />
                      <Button
                        icon="pi pi-trash"
                        onClick={() => removeExpense(rowData.id)}
                        className="p-button-rounded p-button-text p-button-danger"
                        tooltip="Supprimer"
                      />
                    </div>
                  )}
                />
              </DataTable>

              <div className="mt-2 text-lg font-bold">
                Total des charges : {totalExpenses.toFixed(2)} €
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Section Répartition détaillée - Affichage en blocs */}
      {people.length > 0 && expenses.length > 0 && (
        <Card title="Répartition détaillée des charges">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {expenseDistribution.map(expense => (
              <Card
                key={expense.id}
                className="shadow-2"
                style={{ backgroundColor: 'var(--surface-50)' }}
              >
                <div className="text-center">
                  <h3 className="text-base font-bold mb-2 text-primary">
                    {expense.name}
                  </h3>
                  <div className="text-xl font-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                    {expense.amount.toFixed(2)} €
                  </div>
                  <div className="text-left">
                    {expense.shares.map(share => (
                      <div
                        key={share.personId}
                        className="flex justify-content-between align-items-center mb-2 p-2"
                        style={{
                          backgroundColor: 'var(--surface-0)',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <span className="font-semibold">{share.personName}</span>
                        <span className="text-primary font-bold">{share.amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Dialog pour ajouter/modifier une personne */}
      <Dialog
        header={editingPersonId ? "Modifier une personne" : "Ajouter une personne"}
        visible={personDialog}
        onHide={() => {
          setPersonDialog(false);
          setEditingPersonId(null);
          setCurrentPerson({ name: '', income: 0 });
        }}
        style={{ width: '400px' }}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label htmlFor="personName" className="block mb-2">Nom</label>
            <InputText
              id="personName"
              value={currentPerson.name}
              onChange={(e) => setCurrentPerson({...currentPerson, name: e.target.value})}
              className="w-full"
              placeholder="Ex: Marie"
            />
          </div>
          <div>
            <label htmlFor="personIncome" className="block mb-2">Revenu mensuel (€)</label>
            <AmountInput
              value={currentPerson.income}
              onChange={(value) => setCurrentPerson({...currentPerson, income: value})}
            />
          </div>
          <Button
            label={editingPersonId ? "Enregistrer" : "Ajouter"}
            icon="pi pi-check"
            onClick={savePerson}
            className="w-full"
            disabled={!currentPerson.name || currentPerson.income <= 0}
          />
        </div>
      </Dialog>

      {/* Dialog pour ajouter/modifier une charge */}
      <Dialog
        header={editingExpenseId ? "Modifier une charge" : "Ajouter une charge"}
        visible={expenseDialog}
        onHide={() => {
          setExpenseDialog(false);
          setEditingExpenseId(null);
          setCurrentExpense({ name: '', amount: 0 });
        }}
        style={{ width: '400px' }}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label htmlFor="expenseName" className="block mb-2">Nom de la charge</label>
            <InputText
              id="expenseName"
              value={currentExpense.name}
              onChange={(e) => setCurrentExpense({...currentExpense, name: e.target.value})}
              className="w-full"
              placeholder="Ex: Loyer"
            />
          </div>
          <div>
            <label htmlFor="expenseAmount" className="block mb-2">Montant (€)</label>
            <AmountInput
              value={currentExpense.amount}
              onChange={(value) => setCurrentExpense({...currentExpense, amount: value})}
            />
          </div>
          <Button
            label={editingExpenseId ? "Enregistrer" : "Ajouter"}
            icon="pi pi-check"
            onClick={saveExpense}
            className="w-full"
            disabled={!currentExpense.name || currentExpense.amount <= 0}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default ExpenseCalculatorPage;
