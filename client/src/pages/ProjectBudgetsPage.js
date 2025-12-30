import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';
import { ToastContext } from '../context/ToastContext';
import AmountInput from '../components/AmountInput';

const ProjectBudgetsPage = () => {
    const [budgets, setBudgets] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [budgetData, setBudgetData] = useState({ id: null, name: '', totalAmount: null, dateRange: [] });
    const [showArchived, setShowArchived] = useState(false);
    const { showToast } = useContext(ToastContext);

    const fetchBudgets = useCallback(async () => {
        try {
            const url = showArchived ? '/project-budgets?includeArchived=true' : '/project-budgets';
            const response = await api.get(url);
            setBudgets(response.data);
        } catch (error) {
            console.error("Erreur fetch project budgets", error);
            showToast('error', 'Erreur', 'Impossible de charger les budgets de projet');
        }
    }, [showArchived, showToast]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    useTransactionRefresh(fetchBudgets);

    const openNew = () => {
        setBudgetData({ id: null, name: '', totalAmount: null, dateRange: [] });
        setIsDialogVisible(true);
    };

    const editBudget = (budget) => {
        setBudgetData({
            id: budget.id,
            name: budget.name,
            totalAmount: budget.totalAmount,
            dateRange: [new Date(budget.startDate), new Date(budget.endDate)]
        });
        setIsDialogVisible(true);
    };

    const hideDialog = () => setIsDialogVisible(false);

    const saveBudget = async () => {
        const [startDate, endDate] = budgetData.dateRange;
        if (!budgetData.name || !budgetData.totalAmount || !startDate || !endDate) {
            showToast('warn', 'Attention', 'Veuillez remplir tous les champs.');
            return;
        }

        try {
            const payload = { name: budgetData.name, totalAmount: budgetData.totalAmount, startDate, endDate };
            if (budgetData.id) {
                await api.put(`/project-budgets/${budgetData.id}`, payload);
                showToast('success', 'Succès', 'Budget modifié');
            } else {
                await api.post('/project-budgets', payload);
                showToast('success', 'Succès', 'Budget créé');
            }
            fetchBudgets();
            hideDialog();
        } catch (error) {
            showToast('error', 'Erreur', 'Échec de la sauvegarde');
        }
    };

    const toggleArchive = async (budgetId, isArchived) => {
        try {
            await api.patch(`/project-budgets/${budgetId}/archive`);
            showToast('success', 'Succès', isArchived ? 'Budget désarchivé' : 'Budget archivé');
            fetchBudgets();
        } catch (error) {
            showToast('error', 'Erreur', "Échec de l'archivage");
        }
    };

    const confirmDelete = (budgetId) => {
        const deleteBudget = async () => {
            try {
                await api.delete(`/project-budgets/${budgetId}`);
                showToast('success', 'Succès', 'Budget supprimé');
                fetchBudgets();
            } catch (error) {
                showToast('error', 'Erreur', 'Échec de la suppression');
            }
        };
        confirmDialog({
            message: 'Êtes-vous sûr ? La suppression est irréversible.',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteBudget
        });
    };

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const dialogFooter = (<div><Button label="Annuler" onClick={hideDialog} className="p-button-text" /><Button label="Sauvegarder" onClick={saveBudget} /></div>);

    return (
        <div className="p-4">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1 className="text-2xl m-0">Budgets de Projet</h1>
                <div className="flex gap-3 align-items-center">
                    <div className="flex align-items-center gap-2">
                        <label htmlFor="show-archived" className="text-sm">Afficher les archivés</label>
                        <InputSwitch
                            inputId="show-archived"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.value)}
                        />
                    </div>
                    <Button label="Nouveau Budget" icon="pi pi-plus" onClick={openNew} />
                </div>
            </div>
            <div className="grid">
                {budgets.map(budget => {
                    const percentage = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
                    const isArchived = budget.archived;

                    return (
                        <div key={budget.id} className="col-12 md:col-6 lg:col-4">
                            <Card
                                title={
                                    <div className="flex align-items-center gap-2">
                                        <span>{budget.name}</span>
                                        {isArchived && <Badge value="Archivé" severity="secondary" />}
                                    </div>
                                }
                                style={{ opacity: isArchived ? 0.7 : 1 }}
                            >
                                <div className="flex gap-2 mb-3">
                                    {!isArchived && (
                                        <Button
                                            icon="pi pi-pencil"
                                            className="p-button-sm p-button-rounded p-button-success"
                                            onClick={() => editBudget(budget)}
                                            tooltip="Modifier"
                                            tooltipOptions={{ position: 'top' }}
                                        />
                                    )}
                                    <Button
                                        icon={isArchived ? "pi pi-replay" : "pi pi-check"}
                                        className={`p-button-sm p-button-rounded ${isArchived ? 'p-button-info' : 'p-button-warning'}`}
                                        onClick={() => toggleArchive(budget.id, isArchived)}
                                        tooltip={isArchived ? "Désarchiver" : "Archiver"}
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-sm p-button-rounded p-button-danger"
                                        onClick={() => confirmDelete(budget.id)}
                                        tooltip="Supprimer"
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                </div>
                                <p className="font-bold text-xl">{formatCurrency(budget.spentAmount)} / {formatCurrency(budget.totalAmount)}</p>
                                <ProgressBar value={percentage} color={percentage > 100 ? '#EF4444' : '#10B981'} style={{ height: '1.5rem' }} />
                                <p className="text-sm text-gray-500 mt-2">
                                    Du {new Date(budget.startDate).toLocaleDateString('fr-FR')} au {new Date(budget.endDate).toLocaleDateString('fr-FR')}
                                </p>
                            </Card>
                        </div>
                    );
                })}
            </div>

            <Dialog visible={isDialogVisible} style={{ width: '450px' }} header="Détails du Budget Projet" modal onHide={hideDialog} footer={dialogFooter}>
                <div className="field mt-3"><span className="p-float-label"><InputText id="name" value={budgetData.name} onChange={(e) => setBudgetData({ ...budgetData, name: e.target.value })} /><label htmlFor="name">Nom du budget</label></span></div>
                <div className="field mt-4"><span className="p-float-label"><AmountInput id="totalAmount" value={budgetData.totalAmount} onChange={(value) => setBudgetData({ ...budgetData, totalAmount: value })} /><label htmlFor="totalAmount">Montant Total</label></span></div>
                <div className="field mt-4"><span className="p-float-label"><Calendar id="range" value={budgetData.dateRange} onChange={(e) => setBudgetData({ ...budgetData, dateRange: e.value })} selectionMode="range" dateFormat="dd/mm/yy" /><label htmlFor="range">Période</label></span></div>
            </Dialog>
        </div>
    );
};

export default ProjectBudgetsPage;