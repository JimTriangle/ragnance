import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataView } from 'primereact/dataview';
import AmountInput from './AmountInput';

const PurchaseForecast = ({ onUpdate }) => {
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
        } catch (error) { console.error("Erreur ajout item", error); }
    };

    const handlePurchase = async (id) => {
        try {
            await api.put(`/shopping/${id}/purchase`);
            fetchItems();
            onUpdate();
        } catch (error) { console.error("Erreur achat item", error); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/shopping/${id}`);
            fetchItems();
        } catch (error) { console.error("Erreur suppression item", error); }
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
                                <Button icon="pi pi-check" className="p-button-rounded p-button-success p-button-sm" onClick={() => handlePurchase(item.id)} title="Acheter" />
                                <Button icon="pi pi-times" className="p-button-rounded p-button-danger p-button-sm" onClick={() => handleDelete(item.id)} title="Supprimer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card title="Prévisionnel d'achats" pt={{ content: { className: 'p-2' } }}>
            <div className="text-sm mb-2">
                {items.length} article{items.length > 1 ? 's' : ''} – Total : {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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
                    <Button type="submit" icon="pi pi-plus" className="p-button-sm w-full" />
                </div>
            </form>
        </Card>
    );
};

export default PurchaseForecast;