import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { ToastContext } from '../context/ToastContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import AmountInput from '../components/AmountInput';
import useTour from '../hooks/useTour';
import TourButton from '../components/TourButton';
import '../styles/tour.css';

const BudgetsPage = () => {
    const [trackedCategories, setTrackedCategories] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const { showToast } = React.useContext(ToastContext);
    const debounceTimeouts = useRef({});
    const [hasBudgets, setHasBudgets] = useState(true);
    const [isLoadingCopy, setIsLoadingCopy] = useState(false);

    // Ref pour toujours avoir accès à la date courante dans les closures
    const currentDateRef = useRef(currentDate);

    // Configuration du guide utilisateur
    const tourSteps = [
        {
            element: '[data-tour-id="budgets-title"]',
            popover: {
                title: 'Budgets Mensuels 💰',
                description: 'Définissez des budgets mensuels pour chacune de vos catégories suivies. Cela vous aide à contrôler vos dépenses et à mieux gérer vos finances.',
                side: 'bottom',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="month-navigation"]',
            popover: {
                title: 'Navigation par Mois ⬅️➡️',
                description: 'Utilisez les flèches pour naviguer entre les mois. Vous pouvez définir des budgets différents pour chaque mois.',
                side: 'bottom',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="copy-budgets"]',
            popover: {
                title: 'Copier les Budgets 📋',
                description: 'Gagnez du temps ! Si vous n\'avez pas de budgets pour ce mois, vous pouvez copier automatiquement ceux du mois précédent.',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="budgets-table"]',
            popover: {
                title: 'Définir les Budgets 🎯',
                description: 'Entrez un montant de budget pour chaque catégorie. Les changements sont automatiquement sauvegardés après 1 seconde d\'inactivité.',
                side: 'top',
                align: 'start'
            }
        },
        {
            popover: {
                title: 'Conseil 💡',
                description: 'Seules les catégories avec "Suivi Mensuel" activé apparaissent ici. Activez cette option dans la page Catégories pour ajouter d\'autres catégories à suivre.',
            }
        }
    ];

    const { startTour } = useTour('budgets', tourSteps, true);

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

    // Maintenir le ref à jour avec la date courante
    useEffect(() => {
        currentDateRef.current = currentDate;
    }, [currentDate]);

    useTransactionRefresh(fetchData);

    useEffect(() => {
        window.addEventListener('focus', fetchData);
        return () => {
            window.removeEventListener('focus', fetchData);
        };
    }, [fetchData]);

    const handleBudgetChange = (categoryId, amount) => {
        setBudgets(prevBudgets => ({ ...prevBudgets, [categoryId]: amount }));

        // Utiliser le ref pour obtenir la date actuelle (évite les problèmes de closure obsolète)
        const currentDateValue = currentDateRef.current;
        const year = currentDateValue.getFullYear();
        const month = currentDateValue.getMonth() + 1;

        // Utiliser un timeout par catégorie pour éviter d'annuler les modifications sur d'autres catégories
        if (debounceTimeouts.current[categoryId]) {
            clearTimeout(debounceTimeouts.current[categoryId]);
        }
        debounceTimeouts.current[categoryId] = setTimeout(() => {
            saveBudget(categoryId, amount, year, month);
            delete debounceTimeouts.current[categoryId];
        }, 1000);
    };

    const saveBudget = async (categoryId, amountToSave, year, month) => {
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
            <TourButton onStartTour={startTour} tooltip="Revoir le guide des Budgets" />
            <div className="flex justify-content-between align-items-center mb-4" data-tour-id="month-navigation">
                <Button icon="pi pi-arrow-left" onClick={() => changeMonth(-1)} />
                <h1 className="text-2xl capitalize" data-tour-id="budgets-title">{`Budgets Mensuels pour ${monthName} ${year}`}</h1>
                <Button icon="pi pi-arrow-right" onClick={() => changeMonth(1)} />
            </div>

            {!hasBudgets && trackedCategories.length > 0 ? (
                <div className="card mb-4 p-3 bg-blue-50 border-blue-200" data-tour-id="copy-budgets">
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
            ) : (
                <div className="card" data-tour-id="budgets-table">
                    <DataTable value={trackedCategories} size="small">
                        <Column field="name" header="Catégorie" />
                        <Column header="Budget" body={budgetEditor} />
                    </DataTable>
                </div>
            )}
        </div>
    );
};

export default BudgetsPage;