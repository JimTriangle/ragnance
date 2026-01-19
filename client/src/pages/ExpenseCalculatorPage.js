import React, { useState, useMemo, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AmountInput from '../components/AmountInput';

const ExpenseCalculatorPage = () => {
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [personDialog, setPersonDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [currentPerson, setCurrentPerson] = useState({ name: '', income: 0 });
  const [currentExpense, setCurrentExpense] = useState({ name: '', amount: 0 });
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    const savedPeople = localStorage.getItem('expenseCalculator_people');
    const savedExpenses = localStorage.getItem('expenseCalculator_expenses');

    if (savedPeople) {
      try {
        setPeople(JSON.parse(savedPeople));
      } catch (error) {
        console.error('Erreur lors du chargement des personnes:', error);
      }
    }

    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Erreur lors du chargement des charges:', error);
      }
    }
  }, []);

  // Sauvegarder les personnes quand elles changent
  useEffect(() => {
    if (people.length > 0 || localStorage.getItem('expenseCalculator_people')) {
      localStorage.setItem('expenseCalculator_people', JSON.stringify(people));
    }
  }, [people]);

  // Sauvegarder les charges quand elles changent
  useEffect(() => {
    if (expenses.length > 0 || localStorage.getItem('expenseCalculator_expenses')) {
      localStorage.setItem('expenseCalculator_expenses', JSON.stringify(expenses));
    }
  }, [expenses]);

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

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Calculateur de répartition des charges</h1>

      {/* Section Personnes */}
      <Card title="Personnes et revenus" className="mb-4">
        <Button
          label="Ajouter une personne"
          icon="pi pi-plus"
          onClick={openPersonDialog}
          className="mb-3"
        />

        {people.length > 0 && (
          <DataTable value={totalPerPerson} className="mb-3">
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
          <div className="mt-3 text-xl font-bold">
            Revenu total : {totalIncome.toFixed(2)} €
          </div>
        )}
      </Card>

      {/* Section Charges */}
      <Card title="Charges mensuelles" className="mb-4">
        <Button
          label="Ajouter une charge"
          icon="pi pi-plus"
          onClick={openExpenseDialog}
          className="mb-3"
        />

        {expenses.length > 0 && (
          <>
            <DataTable value={expenses} className="mb-3">
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

            <div className="mt-3 text-xl font-bold">
              Total des charges : {totalExpenses.toFixed(2)} €
            </div>
          </>
        )}
      </Card>

      {/* Section Répartition détaillée */}
      {people.length > 0 && expenses.length > 0 && (
        <Card title="Répartition détaillée des charges">
          {expenseDistribution.map(expense => (
            <div key={expense.id} className="mb-4 pb-3" style={{ borderBottom: '1px solid #495057' }}>
              <h3 className="text-lg font-bold mb-2">
                {expense.name} ({expense.amount.toFixed(2)} €)
              </h3>
              <DataTable value={expense.shares} size="small">
                <Column field="personName" header="Personne" />
                <Column
                  field="amount"
                  header="Montant à payer"
                  body={(rowData) => `${rowData.amount.toFixed(2)} €`}
                />
              </DataTable>
            </div>
          ))}
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
