import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import api from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';

const BudgetsPage = () => {
    const [trackedCategories, setTrackedCategories] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const { showToast } = React.useContext(ToastContext);
    const debounceTimeout = useRef(null);

    const fetchData = useCallback(async () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        try {
            const [categoriesRes, budgetsRes] = await Promise.all([
                api.get('/categories?isTracked=true'),
                api.get(`/budgets/${year}/${month}`)
            ]);
            setTrackedCategories(categoriesRes.data);
            const budgetMap = budgetsRes.data.reduce((acc, budget) => {
                acc[budget.CategoryId] = budget.amount;
                return acc;
            }, {});
            setBudgets(budgetMap);
        } catch (error) { console.error("Erreur fetch budgets", error); }
    }, [currentDate]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

     useEffect(() => {
        window.addEventListener('focus', fetchData);
        return () => {
            window.removeEventListener('focus', fetchData);
        };
    }, [fetchData]);

    const handleBudgetChange = (categoryId, amount) => {
        setBudgets(prevBudgets => ({ ...prevBudgets, [categoryId]: amount }));
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            saveBudget(categoryId, amount);
        }, 1000);
    };

    const saveBudget = async (categoryId, amountToSave) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const finalAmount = amountToSave === null || amountToSave === undefined ? 0 : amountToSave;
        try {
            await api.post('/budgets', {
                amount: finalAmount,
                year,
                month,
                CategoryId: categoryId
            });
            showToast('success', 'Succès', 'Budget sauvegardé');
        } catch (error) {
            showToast('error', 'Erreur', 'Échec de la sauvegarde');
        }
    };
    
    const changeMonth = (amount) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };
    
    const budgetEditor = (rowData) => {
        return <InputNumber
            value={budgets[rowData.id] || null}
            placeholder="Définir un budget"
            onValueChange={(e) => handleBudgetChange(rowData.id, e.value)}
            mode="currency" currency="EUR" locale="fr-FR"
            inputClassName="p-inputtext-sm"
        />;
    };

    const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="p-4">
            <div className="flex justify-content-between align-items-center mb-4">
                <Button icon="pi pi-arrow-left" onClick={() => changeMonth(-1)} />
                <h1 className="text-2xl capitalize">{`Budgets Mensuels pour ${monthName} ${year}`}</h1>
                <Button icon="pi pi-arrow-right" onClick={() => changeMonth(1)} />
            </div>
            <div className="card">
                <DataTable value={trackedCategories} size="small">
                    <Column field="name" header="Catégorie" />
                    <Column header="Budget" body={budgetEditor} />
                </DataTable>
            </div>
        </div>
    );
};

export default BudgetsPage;