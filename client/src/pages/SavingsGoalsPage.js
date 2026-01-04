import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';
import { ToastContext } from '../context/ToastContext';
import AmountInput from '../components/AmountInput';

const SavingsGoalsPage = () => {
    const [goals, setGoals] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [isContributionDialogVisible, setIsContributionDialogVisible] = useState(false);
    const [goalData, setGoalData] = useState({ id: null, name: '', description: '', targetAmount: null, startDate: null, targetDate: null });
    const [contributionData, setContributionData] = useState({ amount: null, contributionDate: new Date(), note: '' });
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const { showToast } = useContext(ToastContext);

    const fetchGoals = useCallback(async () => {
        try {
            const url = showArchived ? '/savings-goals?includeArchived=true' : '/savings-goals';
            const response = await api.get(url);
            setGoals(response.data);
        } catch (error) {
            console.error("Erreur fetch savings goals", error);
            showToast('error', 'Erreur', "Impossible de charger les objectifs d'épargne");
        }
    }, [showArchived, showToast]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const openNew = () => {
        setGoalData({ id: null, name: '', description: '', targetAmount: null, startDate: new Date(), targetDate: null });
        setIsDialogVisible(true);
    };

    const editGoal = (goal) => {
        setGoalData({
            id: goal.id,
            name: goal.name,
            description: goal.description || '',
            targetAmount: goal.targetAmount,
            startDate: new Date(goal.startDate),
            targetDate: new Date(goal.targetDate)
        });
        setIsDialogVisible(true);
    };

    const hideDialog = () => setIsDialogVisible(false);

    const openContributionDialog = (goal) => {
        setSelectedGoal(goal);
        setContributionData({ amount: null, contributionDate: new Date(), note: '' });
        setIsContributionDialogVisible(true);
    };

    const hideContributionDialog = () => {
        setIsContributionDialogVisible(false);
        setSelectedGoal(null);
    };

    const saveGoal = async () => {
        if (!goalData.name || !goalData.targetAmount || !goalData.startDate || !goalData.targetDate) {
            showToast('warn', 'Attention', 'Veuillez remplir tous les champs obligatoires.');
            return;
        }

        if (goalData.targetDate <= goalData.startDate) {
            showToast('warn', 'Attention', 'La date de fin doit être postérieure à la date de début.');
            return;
        }

        try {
            const payload = {
                name: goalData.name,
                description: goalData.description,
                targetAmount: goalData.targetAmount,
                startDate: goalData.startDate.toISOString().split('T')[0],
                targetDate: goalData.targetDate.toISOString().split('T')[0]
            };

            if (goalData.id) {
                await api.put(`/savings-goals/${goalData.id}`, payload);
                showToast('success', 'Succès', "Objectif d'épargne modifié");
            } else {
                await api.post('/savings-goals', payload);
                showToast('success', 'Succès', "Objectif d'épargne créé");
            }
            fetchGoals();
            hideDialog();
        } catch (error) {
            showToast('error', 'Erreur', 'Échec de la sauvegarde');
        }
    };

    const saveContribution = async () => {
        if (!contributionData.amount || contributionData.amount <= 0) {
            showToast('warn', 'Attention', 'Veuillez saisir un montant valide.');
            return;
        }

        if (!contributionData.contributionDate) {
            showToast('warn', 'Attention', 'Veuillez sélectionner une date.');
            return;
        }

        try {
            const payload = {
                amount: contributionData.amount,
                contributionDate: contributionData.contributionDate.toISOString().split('T')[0],
                note: contributionData.note
            };

            await api.post(`/savings-goals/${selectedGoal.id}/contributions`, payload);
            showToast('success', 'Succès', 'Contribution ajoutée');
            fetchGoals();
            hideContributionDialog();
        } catch (error) {
            showToast('error', 'Erreur', "Échec de l'ajout de la contribution");
        }
    };

    const deleteContribution = async (goalId, contributionId) => {
        try {
            await api.delete(`/savings-goals/${goalId}/contributions/${contributionId}`);
            showToast('success', 'Succès', 'Contribution supprimée');
            fetchGoals();
        } catch (error) {
            showToast('error', 'Erreur', 'Échec de la suppression');
        }
    };

    const toggleArchive = async (goalId, isArchived) => {
        try {
            await api.patch(`/savings-goals/${goalId}/archive`);
            showToast('success', 'Succès', isArchived ? "Objectif désarchivé" : "Objectif archivé");
            fetchGoals();
        } catch (error) {
            showToast('error', 'Erreur', "Échec de l'archivage");
        }
    };

    const confirmDelete = (goalId) => {
        const deleteGoal = async () => {
            try {
                await api.delete(`/savings-goals/${goalId}`);
                showToast('success', 'Succès', "Objectif d'épargne supprimé");
                fetchGoals();
            } catch (error) {
                showToast('error', 'Erreur', 'Échec de la suppression');
            }
        };
        confirmDialog({
            message: 'Êtes-vous sûr ? La suppression est irréversible.',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteGoal
        });
    };

    const calculateProgress = (currentAmount, targetAmount) => {
        if (!targetAmount || targetAmount === 0) return 0;
        return Math.min(100, ((currentAmount / targetAmount) * 100));
    };

    const getDaysRemaining = (targetDate) => {
        const today = new Date();
        const target = new Date(targetDate);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const dialogFooter = (
        <div>
            <Button label="Annuler" onClick={hideDialog} className="p-button-text" />
            <Button label="Sauvegarder" onClick={saveGoal} />
        </div>
    );

    const contributionDialogFooter = (
        <div>
            <Button label="Annuler" onClick={hideContributionDialog} className="p-button-text" />
            <Button label="Ajouter" onClick={saveContribution} />
        </div>
    );

    return (
        <div className="p-4">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1 className="text-2xl m-0">Objectifs d'Épargne</h1>
                <div className="flex gap-3 align-items-center">
                    <div className="flex align-items-center gap-2">
                        <label htmlFor="show-archived" className="text-sm">Afficher les archivés</label>
                        <InputSwitch
                            inputId="show-archived"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.value)}
                        />
                    </div>
                    <Button label="Nouvel Objectif" icon="pi pi-plus" onClick={openNew} />
                </div>
            </div>

            <div className="grid">
                {goals.map(goal => {
                    const isArchived = goal.archived;
                    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                    const daysRemaining = getDaysRemaining(goal.targetDate);
                    const isCompleted = goal.currentAmount >= goal.targetAmount;
                    const isOverdue = daysRemaining < 0 && !isCompleted;
                    const contributions = goal.contributions || [];

                    return (
                        <div key={goal.id} className="col-12 md:col-6 lg:col-4">
                            <Card
                                title={
                                    <div className="flex align-items-center gap-2">
                                        <span>{goal.name}</span>
                                        {isArchived && <Badge value="Archivé" severity="secondary" />}
                                        {isCompleted && !isArchived && <Badge value="Atteint" severity="success" />}
                                        {isOverdue && !isArchived && <Badge value="En retard" severity="danger" />}
                                    </div>
                                }
                                style={{ opacity: isArchived ? 0.7 : 1 }}
                            >
                                <div className="flex gap-2 mb-3">
                                    {!isArchived && (
                                        <>
                                            <Button
                                                icon="pi pi-pencil"
                                                className="p-button-sm p-button-rounded p-button-success"
                                                onClick={() => editGoal(goal)}
                                                tooltip="Modifier"
                                                tooltipOptions={{ position: 'top' }}
                                            />
                                            <Button
                                                icon="pi pi-plus"
                                                className="p-button-sm p-button-rounded p-button-primary"
                                                onClick={() => openContributionDialog(goal)}
                                                tooltip="Ajouter une contribution"
                                                tooltipOptions={{ position: 'top' }}
                                            />
                                        </>
                                    )}
                                    <Button
                                        icon={isArchived ? "pi pi-replay" : "pi pi-check"}
                                        className={`p-button-sm p-button-rounded ${isArchived ? 'p-button-info' : 'p-button-warning'}`}
                                        onClick={() => toggleArchive(goal.id, isArchived)}
                                        tooltip={isArchived ? "Désarchiver" : "Archiver"}
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-sm p-button-rounded p-button-danger"
                                        onClick={() => confirmDelete(goal.id)}
                                        tooltip="Supprimer"
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                </div>

                                {goal.description && (
                                    <p className="text-sm text-500 mb-3">{goal.description}</p>
                                )}

                                <div className="mb-3">
                                    <div className="flex justify-content-between mb-2">
                                        <span className="font-semibold">Progression</span>
                                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                                    </div>
                                    <ProgressBar
                                        value={progress}
                                        showValue={false}
                                        color={isCompleted ? '#22c55e' : isOverdue ? '#ef4444' : '#3b82f6'}
                                    />
                                    <div className="flex justify-content-between mt-2 text-sm">
                                        <span>{formatCurrency(goal.currentAmount)}</span>
                                        <span className="text-500">sur {formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="flex justify-content-between text-sm">
                                        <span className="text-500">Début:</span>
                                        <span>{formatDate(goal.startDate)}</span>
                                    </div>
                                    <div className="flex justify-content-between text-sm">
                                        <span className="text-500">Objectif:</span>
                                        <span>{formatDate(goal.targetDate)}</span>
                                    </div>
                                    {daysRemaining >= 0 && !isCompleted && (
                                        <div className="flex justify-content-between text-sm mt-1">
                                            <span className="text-500">Temps restant:</span>
                                            <span className={daysRemaining < 30 ? 'text-orange-500 font-semibold' : ''}>
                                                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {contributions.length > 0 && (
                                    <div className="mt-3">
                                        <p className="font-semibold mb-2 text-sm">Contributions récentes:</p>
                                        <div className="max-h-10rem overflow-y-auto">
                                            {contributions.slice(0, 3).map((contribution) => (
                                                <div key={contribution.id} className="flex justify-content-between align-items-center mb-2 p-2 border-round surface-100">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{formatCurrency(contribution.amount)}</div>
                                                        <div className="text-xs text-500">{formatDate(contribution.contributionDate)}</div>
                                                        {contribution.note && <div className="text-xs text-500 mt-1">{contribution.note}</div>}
                                                    </div>
                                                    {!isArchived && (
                                                        <Button
                                                            icon="pi pi-trash"
                                                            className="p-button-text p-button-rounded p-button-sm p-button-danger"
                                                            onClick={() => deleteContribution(goal.id, contribution.id)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            {contributions.length > 3 && (
                                                <p className="text-xs text-500 text-center mt-2">
                                                    +{contributions.length - 3} autre{contributions.length - 3 > 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {contributions.length === 0 && (
                                    <p className="text-sm text-500 text-center mt-3">Aucune contribution</p>
                                )}
                            </Card>
                        </div>
                    );
                })}
            </div>

            {goals.length === 0 && (
                <div className="text-center p-5">
                    <i className="pi pi-inbox text-6xl text-400 mb-3"></i>
                    <p className="text-xl text-500">Aucun objectif d'épargne</p>
                    <p className="text-sm text-500 mb-3">Créez votre premier objectif pour commencer à épargner</p>
                    <Button label="Créer un objectif" icon="pi pi-plus" onClick={openNew} />
                </div>
            )}

            <Dialog
                visible={isDialogVisible}
                style={{ width: '600px' }}
                header="Détails de l'Objectif d'Épargne"
                modal
                onHide={hideDialog}
                footer={dialogFooter}
            >
                <div className="field mt-3">
                    <span className="p-float-label">
                        <InputText
                            id="name"
                            value={goalData.name}
                            onChange={(e) => setGoalData({ ...goalData, name: e.target.value })}
                            className="w-full"
                        />
                        <label htmlFor="name">Nom de l'objectif *</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <InputTextarea
                            id="description"
                            value={goalData.description}
                            onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                            className="w-full"
                            rows={3}
                        />
                        <label htmlFor="description">Description (optionnel)</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <AmountInput
                            id="targetAmount"
                            value={goalData.targetAmount}
                            onChange={(value) => setGoalData({ ...goalData, targetAmount: value })}
                        />
                        <label htmlFor="targetAmount">Montant Objectif *</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <Calendar
                            id="startDate"
                            value={goalData.startDate}
                            onChange={(e) => setGoalData({ ...goalData, startDate: e.value })}
                            className="w-full"
                            dateFormat="dd/mm/yy"
                            showIcon
                        />
                        <label htmlFor="startDate">Date de début *</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <Calendar
                            id="targetDate"
                            value={goalData.targetDate}
                            onChange={(e) => setGoalData({ ...goalData, targetDate: e.value })}
                            className="w-full"
                            dateFormat="dd/mm/yy"
                            showIcon
                        />
                        <label htmlFor="targetDate">Date objectif *</label>
                    </span>
                </div>
            </Dialog>

            <Dialog
                visible={isContributionDialogVisible}
                style={{ width: '500px' }}
                header="Ajouter une Contribution"
                modal
                onHide={hideContributionDialog}
                footer={contributionDialogFooter}
            >
                {selectedGoal && (
                    <div className="mb-3 p-3 border-round surface-100">
                        <p className="font-semibold mb-1">{selectedGoal.name}</p>
                        <p className="text-sm text-500">
                            {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
                        </p>
                    </div>
                )}

                <div className="field mt-4">
                    <span className="p-float-label">
                        <AmountInput
                            id="contributionAmount"
                            value={contributionData.amount}
                            onChange={(value) => setContributionData({ ...contributionData, amount: value })}
                        />
                        <label htmlFor="contributionAmount">Montant *</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <Calendar
                            id="contributionDate"
                            value={contributionData.contributionDate}
                            onChange={(e) => setContributionData({ ...contributionData, contributionDate: e.value })}
                            className="w-full"
                            dateFormat="dd/mm/yy"
                            showIcon
                        />
                        <label htmlFor="contributionDate">Date *</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <InputTextarea
                            id="note"
                            value={contributionData.note}
                            onChange={(e) => setContributionData({ ...contributionData, note: e.target.value })}
                            className="w-full"
                            rows={3}
                        />
                        <label htmlFor="note">Note (optionnel)</label>
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default SavingsGoalsPage;
