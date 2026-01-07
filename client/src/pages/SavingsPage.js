import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';
import { ToastContext } from '../context/ToastContext';
import AmountInput from '../components/AmountInput';

const SavingsPage = () => {
    const [savings, setSavings] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [savingsData, setSavingsData] = useState({ id: null, name: '', totalAmount: null, parts: [] });
    const [showArchived, setShowArchived] = useState(false);
    const { showToast } = useContext(ToastContext);

    const fetchSavings = useCallback(async () => {
        try {
            const url = showArchived ? '/savings?includeArchived=true' : '/savings';
            const response = await api.get(url);
            setSavings(response.data);
        } catch (error) {
            console.error("Erreur fetch savings", error);
            showToast('error', 'Erreur', 'Impossible de charger les épargnes');
        }
    }, [showArchived, showToast]);

    useEffect(() => {
        fetchSavings();
    }, [fetchSavings]);

    const openNew = () => {
        setSavingsData({ id: null, name: '', totalAmount: null, parts: [] });
        setIsDialogVisible(true);
    };

    const editSavings = (saving) => {
        setSavingsData({
            id: saving.id,
            name: saving.name,
            totalAmount: saving.totalAmount,
            parts: saving.parts || []
        });
        setIsDialogVisible(true);
    };

    const hideDialog = () => setIsDialogVisible(false);

    const saveSavings = async () => {
        if (!savingsData.name || !savingsData.totalAmount) {
            showToast('warn', 'Attention', 'Veuillez remplir le nom et le montant total.');
            return;
        }

        try {
            // Filtrer les parts valides (avec description et montant)
            const validParts = savingsData.parts.filter(part =>
                part.description && part.description.trim() !== '' &&
                part.amount !== null && part.amount !== undefined && part.amount > 0
            );

            const payload = {
                name: savingsData.name,
                totalAmount: savingsData.totalAmount,
                parts: validParts
            };

            if (savingsData.id) {
                await api.put(`/savings/${savingsData.id}`, payload);
                showToast('success', 'Succès', 'Épargne modifiée');
            } else {
                await api.post('/savings', payload);
                showToast('success', 'Succès', 'Épargne créée');
            }
            fetchSavings();
            hideDialog();
        } catch (error) {
            showToast('error', 'Erreur', 'Échec de la sauvegarde');
        }
    };

    const toggleArchive = async (savingsId, isArchived) => {
        try {
            await api.patch(`/savings/${savingsId}/archive`);
            showToast('success', 'Succès', isArchived ? 'Épargne désarchivée' : 'Épargne archivée');
            fetchSavings();
        } catch (error) {
            showToast('error', 'Erreur', "Échec de l'archivage");
        }
    };

    const confirmDelete = (savingsId) => {
        const deleteSavings = async () => {
            try {
                await api.delete(`/savings/${savingsId}`);
                showToast('success', 'Succès', 'Épargne supprimée');
                fetchSavings();
            } catch (error) {
                showToast('error', 'Erreur', 'Échec de la suppression');
            }
        };
        confirmDialog({
            message: 'Êtes-vous sûr ? La suppression est irréversible.',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteSavings
        });
    };

    const addPart = () => {
        setSavingsData({
            ...savingsData,
            parts: [...savingsData.parts, { description: '', amount: null }]
        });
    };

    const updatePart = (index, field, value) => {
        const updatedParts = [...savingsData.parts];
        updatedParts[index][field] = value;
        setSavingsData({ ...savingsData, parts: updatedParts });
    };

    const removePart = (index) => {
        const updatedParts = savingsData.parts.filter((_, i) => i !== index);
        setSavingsData({ ...savingsData, parts: updatedParts });
    };

    const calculateAllocatedAmount = (parts) => {
        return parts.reduce((sum, part) => sum + (parseFloat(part.amount) || 0), 0);
    };

    const calculatePercentage = (amount, total) => {
        if (!total || total === 0) return 0;
        return ((amount / total) * 100).toFixed(1);
    };

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    const dialogFooter = (
        <div>
            <Button label="Annuler" onClick={hideDialog} className="p-button-text" />
            <Button label="Sauvegarder" onClick={saveSavings} />
        </div>
    );

    return (
        <div className="p-4">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1 className="text-2xl m-0">Épargnes</h1>
                <div className="flex gap-3 align-items-center">
                    <div className="flex align-items-center gap-2">
                        <label htmlFor="show-archived" className="text-sm">Afficher les archivées</label>
                        <InputSwitch
                            inputId="show-archived"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.value)}
                        />
                    </div>
                    <Button label="Nouvelle Épargne" icon="pi pi-plus" onClick={openNew} />
                </div>
            </div>

            <div className="grid">
                {savings.map(saving => {
                    const isArchived = saving.archived;
                    const parts = saving.parts || [];
                    const allocatedAmount = calculateAllocatedAmount(parts);
                    const unallocatedAmount = saving.totalAmount - allocatedAmount;

                    return (
                        <div key={saving.id} className="col-12 md:col-6 lg:col-4">
                            <Card
                                title={
                                    <div className="flex align-items-center gap-2">
                                        <span>{saving.name}</span>
                                        {isArchived && <Badge value="Archivée" severity="secondary" />}
                                    </div>
                                }
                                style={{ opacity: isArchived ? 0.7 : 1 }}
                            >
                                <div className="flex gap-2 mb-3">
                                    {!isArchived && (
                                        <Button
                                            icon="pi pi-pencil"
                                            className="p-button-sm p-button-rounded p-button-success"
                                            onClick={() => editSavings(saving)}
                                            tooltip="Modifier"
                                            tooltipOptions={{ position: 'top' }}
                                        />
                                    )}
                                    <Button
                                        icon={isArchived ? "pi pi-replay" : "pi pi-check"}
                                        className={`p-button-sm p-button-rounded ${isArchived ? 'p-button-info' : 'p-button-warning'}`}
                                        onClick={() => toggleArchive(saving.id, isArchived)}
                                        tooltip={isArchived ? "Désarchiver" : "Archiver"}
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-sm p-button-rounded p-button-danger"
                                        onClick={() => confirmDelete(saving.id)}
                                        tooltip="Supprimer"
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                </div>

                                <p className="font-bold text-xl mb-3">Total: {formatCurrency(saving.totalAmount)}</p>

                                {parts.length > 0 ? (
                                    <div className="mb-3">
                                        <p className="font-semibold mb-2">Répartition:</p>
                                        {parts.map((part, idx) => (
                                            <div key={idx} className="flex justify-content-between align-items-center mb-2 p-2 border-round surface-100">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{part.description}</div>
                                                    <div className="text-xs text-500">{formatCurrency(part.amount)}</div>
                                                </div>
                                                <Badge
                                                    value={`${calculatePercentage(part.amount, saving.totalAmount)}%`}
                                                    severity="info"
                                                />
                                            </div>
                                        ))}
                                        {unallocatedAmount > 0 && (
                                            <div className="flex justify-content-between align-items-center p-2 border-round surface-200">
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">Non affecté</div>
                                                    <div className="text-xs text-500">{formatCurrency(unallocatedAmount)}</div>
                                                </div>
                                                <Badge
                                                    value={`${calculatePercentage(unallocatedAmount, saving.totalAmount)}%`}
                                                    severity="warning"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-500">Aucune part définie</p>
                                )}
                            </Card>
                        </div>
                    );
                })}
            </div>

            <Dialog
                visible={isDialogVisible}
                style={{ width: '600px' }}
                header="Détails de l'Épargne"
                modal
                onHide={hideDialog}
                footer={dialogFooter}
            >
                <div className="field mt-3">
                    <span className="p-float-label">
                        <InputText
                            id="name"
                            value={savingsData.name}
                            onChange={(e) => setSavingsData({ ...savingsData, name: e.target.value })}
                            className="w-full"
                        />
                        <label htmlFor="name">Nom de l'épargne</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <span className="p-float-label">
                        <AmountInput
                            id="totalAmount"
                            value={savingsData.totalAmount}
                            onChange={(value) => setSavingsData({ ...savingsData, totalAmount: value })}
                        />
                        <label htmlFor="totalAmount">Montant Total</label>
                    </span>
                </div>

                <div className="field mt-4">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <label className="font-semibold">Parts de l'épargne</label>
                        <Button
                            label="Ajouter une part"
                            icon="pi pi-plus"
                            className="p-button-sm"
                            onClick={addPart}
                        />
                    </div>

                    {savingsData.parts.length > 0 ? (
                        <div className="mt-2">
                            {savingsData.parts.map((part, index) => (
                                <div key={index} className="p-3 mb-2 border-round surface-100">
                                    <div className="flex gap-2 align-items-end">
                                        <div className="flex-1">
                                            <span className="p-float-label">
                                                <InputText
                                                    id={`part-desc-${index}`}
                                                    value={part.description}
                                                    onChange={(e) => updatePart(index, 'description', e.target.value)}
                                                    className="w-full"
                                                />
                                                <label htmlFor={`part-desc-${index}`}>Description</label>
                                            </span>
                                        </div>
                                        <div style={{ width: '150px' }}>
                                            <span className="p-float-label">
                                                <AmountInput
                                                    id={`part-amount-${index}`}
                                                    value={part.amount}
                                                    onChange={(value) => updatePart(index, 'amount', value)}
                                                />
                                                <label htmlFor={`part-amount-${index}`}>Montant</label>
                                            </span>
                                        </div>
                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-danger p-button-sm"
                                            onClick={() => removePart(index)}
                                        />
                                    </div>
                                    {savingsData.totalAmount > 0 && part.amount > 0 && (
                                        <div className="text-xs text-500 mt-2">
                                            {calculatePercentage(part.amount, savingsData.totalAmount)}% du total
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="mt-3 p-3 border-round surface-200">
                                <div className="flex justify-content-between">
                                    <span className="font-semibold">Total affecté:</span>
                                    <span>{formatCurrency(calculateAllocatedAmount(savingsData.parts))}</span>
                                </div>
                                <div className="flex justify-content-between mt-1">
                                    <span className="font-semibold">Non affecté:</span>
                                    <span className={savingsData.totalAmount - calculateAllocatedAmount(savingsData.parts) < 0 ? 'text-red-500' : ''}>
                                        {formatCurrency(savingsData.totalAmount - calculateAllocatedAmount(savingsData.parts))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-500 mt-2">Aucune part définie. Cliquez sur "Ajouter une part" pour commencer.</p>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default SavingsPage;
