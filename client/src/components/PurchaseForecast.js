import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataView } from 'primereact/dataview';
import AmountInput from './AmountInput';
import { ToastContext } from '../context/ToastContext';
import '../styles/cards.css';

const PurchaseForecast = ({ onUpdate }) => {
    const { showToast } = useContext(ToastContext);
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [price, setPrice] = useState(null);
    const [url, setUrl] = useState('');

    const fetchItems = async () => {
        try {
            const response = await api.get('/shopping');
            setItems(response.data);
        } catch (error) { console.error("Erreur fetch shopping list", error); }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!itemName || price === null || price <= 0) return;
        try {
            await api.post('/shopping', { itemName, price, url });
            setItemName('');
            setPrice(null);
            setUrl('');
            fetchItems();
            showToast('success', 'Succès', 'Article ajouté à la liste');
        } catch (error) {
            console.error("Erreur ajout item", error);
            showToast('error', 'Erreur', "Impossible d'ajouter l'article");
        }
    };

    const handlePurchase = async (id) => {
        try {
            await api.put(`/shopping/${id}/purchase`);
            fetchItems();
            onUpdate();
            showToast('success', 'Succès', 'Article marqué comme acheté');
        } catch (error) {
            console.error("Erreur achat item", error);
            showToast('error', 'Erreur', "Impossible de marquer l'article comme acheté");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/shopping/${id}`);
            fetchItems();
            showToast('success', 'Succès', 'Article supprimé de la liste');
        } catch (error) {
            console.error("Erreur suppression item", error);
            showToast('error', 'Erreur', "Impossible de supprimer l'article");
        }
    };
    const totalCost = items.reduce((sum, item) => sum + item.price, 0);
    const itemTemplate = (item) => {
        return (
            <div className="col-12">
                <div className="flex flex-column xl:flex-row xl:align-items-start p-2 gap-2">
                    <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-2">
                        <div className="flex flex-column align-items-center sm:align-items-start gap-2">
                            <div className="font-bold text-sm">
                                {item.itemName}
                                {item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-2">
                                        <i className="pi pi-external-link" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex sm:flex-column align-items-center sm:align-items-end gap-2 sm:gap-2">
                            <span className="font-semibold text-sm">{item.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                            <div className='flex gap-2'>
                                <Button icon="pi pi-check" className="btn-icon-modern btn-icon-modern--success" onClick={() => handlePurchase(item.id)} tooltip="Acheter" tooltipOptions={{ position: 'top' }} />
                                <Button icon="pi pi-times" className="btn-icon-modern btn-icon-modern--danger" onClick={() => handleDelete(item.id)} tooltip="Supprimer" tooltipOptions={{ position: 'top' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="chart-card h-full">
            <div className="chart-card__header">
                <h2 className="chart-card__title">Prévisionnel d'achats</h2>
                <span className="chart-card__subtitle">
                    {items.length} article{items.length > 1 ? 's' : ''} — {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
            </div>
            <DataView value={items} itemTemplate={itemTemplate} emptyMessage="Aucun achat prévu pour le moment." />
            <form onSubmit={handleAddItem} className="grid grid-nogutter mt-2 align-items-center">
                <div className="col-5 pr-2">
                    <InputText value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Article" className="p-inputtext-sm w-full" />
                </div>
                <div className="col-3 pr-2">
                    <AmountInput value={price} onChange={(value) => setPrice(value)} placeholder="Prix" className="p-inputtext-sm w-full" />
                </div>
                <div className="col-3 pr-2">
                    <InputText value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="p-inputtext-sm w-full" />
                </div>
                <div className="col-1">
                    <Button type="submit" icon="pi pi-plus" className="btn-icon-modern btn-icon-modern--success" style={{ width: '100%' }} />
                </div>
            </form>
        </div>
    );
};

export default PurchaseForecast;