import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { ToastContext } from '../context/ToastContext';
import { Button } from 'primereact/button';
import AmountInput from '../components/AmountInput';
import useTour from '../hooks/useTour';
import TourButton from '../components/TourButton';
import MonthPicker from '../components/MonthPicker';
import '../styles/tour.css';
import '../styles/budgets.css';

const BudgetsPage = () => {
    const [trackedCategories, setTrackedCategories] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const { showToast } = React.useContext(ToastContext);
    const debounceTimeouts = useRef({});
    const [hasBudgets, setHasBudgets] = useState(true);
    const [isLoadingCopy, setIsLoadingCopy] = useState(false);
    const [savingCategories, setSavingCategories] = useState({});
    const [savedCategories, setSavedCategories] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const savedTimeouts = useRef({});

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
            element: '[data-tour-id="budgets-grid"]',
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
        setSavingCategories(prev => ({ ...prev, [categoryId]: true }));

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
            setSavingCategories(prev => ({ ...prev, [categoryId]: false }));
            setSavedCategories(prev => ({ ...prev, [categoryId]: true }));
            if (savedTimeouts.current[categoryId]) clearTimeout(savedTimeouts.current[categoryId]);
            savedTimeouts.current[categoryId] = setTimeout(() => {
                setSavedCategories(prev => ({ ...prev, [categoryId]: false }));
                delete savedTimeouts.current[categoryId];
            }, 2000);
        } catch (error) {
            setSavingCategories(prev => ({ ...prev, [categoryId]: false }));
            showToast('error', 'Erreur', 'Échec de la sauvegarde');
        }
    };

    const changeMonth = (amount) => {
        // Annuler TOUS les timeouts de sauvegarde en cours pour éviter
        // de sauvegarder des données sur le mauvais mois
        Object.keys(debounceTimeouts.current).forEach(key => {
            clearTimeout(debounceTimeouts.current[key]);
            delete debounceTimeouts.current[key];
        });

        // Réinitialiser les budgets pour éviter d'afficher les anciennes valeurs
        setBudgets({});

        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const goToMonth = (newDate) => {
        Object.keys(debounceTimeouts.current).forEach(key => {
            clearTimeout(debounceTimeouts.current[key]);
            delete debounceTimeouts.current[key];
        });
        setBudgets({});
        setCurrentDate(newDate);
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

    // Clé unique pour forcer le re-render des inputs quand le mois change
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

    return (
        <div className="p-4">
            <TourButton onStartTour={startTour} tooltip="Revoir le guide des Budgets" />

            <div className="budgets-header" data-tour-id="budgets-title">
                <div>
                    <h1 className="budgets-title">Budgets Mensuels</h1>
                    <p className="budgets-subtitle">
                        {trackedCategories.length} catégorie{trackedCategories.length !== 1 ? 's' : ''} suivie{trackedCategories.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="budgets-toolbar">
                <div className="budgets-month-nav" data-tour-id="month-navigation">
                <Button
                    icon="pi pi-chevron-left"
                    className="btn-icon-modern"
                    onClick={() => changeMonth(-1)}
                    aria-label="Mois précédent"
                />
                <MonthPicker currentDate={currentDate} onMonthSelect={goToMonth} className="budgets-month-label" />
                <Button
                    icon="pi pi-chevron-right"
                    className="btn-icon-modern"
                    onClick={() => changeMonth(1)}
                    aria-label="Mois suivant"
                />
                </div>
                <div className="budgets-view-toggle">
                    <Button
                        icon="pi pi-th-large"
                        className={`btn-icon-modern ${viewMode === 'grid' ? 'btn-icon-modern--active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        aria-label="Affichage en grille"
                        tooltip="Grille"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                        icon="pi pi-list"
                        className={`btn-icon-modern ${viewMode === 'list' ? 'btn-icon-modern--active' : ''}`}
                        onClick={() => setViewMode('list')}
                        aria-label="Affichage en liste"
                        tooltip="Liste"
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>

            {!hasBudgets && trackedCategories.length > 0 && (
                <div className="budgets-copy-banner" data-tour-id="copy-budgets">
                    <div className="budgets-copy-banner__text">
                        <i className="pi pi-info-circle" />
                        <span>Aucun budget défini pour ce mois. Voulez-vous copier les budgets du mois précédent ?</span>
                    </div>
                    <Button
                        label="Copier"
                        icon="pi pi-copy"
                        className="btn-modern btn-modern--sm"
                        onClick={copyFromPreviousMonth}
                        loading={isLoadingCopy}
                    />
                </div>
            )}

            <div className={viewMode === 'grid' ? 'budgets-grid' : 'budgets-list'} data-tour-id="budgets-grid">
                {trackedCategories.map((category) => {
                    const isSaving = savingCategories[category.id];
                    const isSaved = savedCategories[category.id];
                    return (
                        <div key={category.id} className={viewMode === 'grid' ? 'budget-card' : 'budget-card budget-card--list'}>
                            <div className="budget-card__info">
                                <span
                                    className="budget-card__color"
                                    style={{ backgroundColor: category.color }}
                                />
                                <span className="budget-card__name">{category.name}</span>
                            </div>
                            <div className="budget-card__input">
                                <AmountInput
                                    key={`${monthKey}-${category.id}`}
                                    value={budgets[category.id] || null}
                                    placeholder="Définir un budget"
                                    onChange={(value) => handleBudgetChange(category.id, value)}
                                    className="p-inputtext-sm"
                                />
                                {isSaving && (
                                    <span className="budget-card__status budget-card__status--saving">
                                        <i className="pi pi-spin pi-spinner" />
                                        Sauvegarde...
                                    </span>
                                )}
                                {!isSaving && isSaved && (
                                    <span className="budget-card__status budget-card__status--saved">
                                        <i className="pi pi-check" />
                                        Sauvegardé
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {trackedCategories.length === 0 && (
                    <div className="budgets-empty">
                        <i className="pi pi-wallet" />
                        <p>Aucune catégorie suivie. Activez le suivi mensuel dans la page Catégories.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetsPage;
