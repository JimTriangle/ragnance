import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { ToastContext } from '../context/ToastContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AmountInput from '../components/AmountInput';

const BudgetsPage = () => {
    const [trackedCategories, setTrackedCategories] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const { showToast } = React.useContext(ToastContext);
    const debounceTimeout = useRef(null);
    const [hasBudgets, setHasBudgets] = useState(true);
    const [isLoadingCopy, setIsLoadingCopy] = useState(false);

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
            setHasBudgets(budgetsRes.data.length > 0);
        } catch (error) { console.error("Erreur fetch budgets", error); }
    }, [currentDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useTransactionRefresh(fetchData);

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

    const copyFromPreviousMonth = async () => {
        setIsLoadingCopy(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        // Calculer le mois précédent
        const prevDate = new Date(currentDate);
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;

        try {
            const response = await api.post('/budgets/copy', {
                fromYear: prevYear,
                fromMonth: prevMonth,
                toYear: year,
                toMonth: month
            });

            showToast('success', 'Succès', response.data.message);
            await fetchData(); // Recharger les données
        } catch (error) {
            if (error.response?.status === 404) {
                showToast('warn', 'Attention', 'Aucun budget trouvé pour le mois précédent');
            } else {
                showToast('error', 'Erreur', 'Échec de la copie des budgets');
            }
        } finally {
            setIsLoadingCopy(false);
        }
    };

    const budgetEditor = (rowData) => {
        return <AmountInput
            value={budgets[rowData.id] || null}
            placeholder="Définir un budget"
            onChange={(value) => handleBudgetChange(rowData.id, value)}
            className="p-inputtext-sm"
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

            {!hasBudgets && trackedCategories.length > 0 && (
                <div className="card mb-4 p-3 bg-blue-50 border-blue-200">
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <i className="pi pi-info-circle mr-2 text-blue-500"></i>
                            <span className="text-blue-800">Aucun budget défini pour ce mois. Voulez-vous copier les budgets du mois précédent ?</span>
                        </div>
                        <Button
                            label="Copier les budgets"
                            icon="pi pi-copy"
                            className="p-button-sm"
                            onClick={copyFromPreviousMonth}
                            loading={isLoadingCopy}
                        />
                    </div>
                </div>
            )}

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