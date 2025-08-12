import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import { InputSwitch } from 'primereact/inputswitch';

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState('CCCCCC');
    const [isTracked, setIsTracked] = useState(false);
    const toast = useRef(null);

    const fetchCategories = async () => {
        const response = await api.get('/categories');
        setCategories(response.data);
    };

    useEffect(() => { fetchCategories(); }, []);

    const openNew = () => {
        setName('');
        setColor('CCCCCC');
        setIsTracked(false);
        setIsDialogVisible(true);
    };

    const hideDialog = () => setIsDialogVisible(false);

    const saveCategory = async () => {
        if (!name) return;
        try {
            await api.post('/categories', { name, color: `#${color}`, isTrackedMonthly: isTracked });
            fetchCategories();
            hideDialog();
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie créée' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La création a échoué' });
        }
    };

    const deleteCategory = async (categoryId) => {
        try {
            await api.delete(`/categories/${categoryId}`);
            fetchCategories();
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie supprimée' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La suppression a échoué' });
        }
    };

    const onTrackedChange = async (e, category) => {
        const updatedCategory = { ...category, isTrackedMonthly: e.value };
        try {
            await api.put(`/categories/${category.id}`, updatedCategory);
            let _categories = [...categories];
            const index = _categories.findIndex(c => c.id === category.id);
            _categories[index] = updatedCategory;
            setCategories(_categories);
            toast.current.show({ severity: 'info', summary: 'Mise à jour', detail: 'Suivi mensuel modifié', life: 2000 });
        } catch (error) {
             toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La mise à jour a échoué' });
        }
    };

    const trackedBodyTemplate = (rowData) => {
        return <InputSwitch checked={rowData.isTrackedMonthly} onChange={(e) => onTrackedChange(e, rowData)} />;
    };

    const actionBodyTemplate = (rowData) => {
        return <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteCategory(rowData.id)} />;
    };

    const colorBodyTemplate = (rowData) => {
        return <div style={{ width: '2rem', height: '2rem', backgroundColor: rowData.color, borderRadius: '50%', border: '1px solid #ccc' }}></div>;
    };
    
    const dialogFooter = (<div><Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} /><Button label="Sauvegarder" icon="pi pi-check" onClick={saveCategory} /></div>);

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h1>Gestion des Catégories</h1>
            <div className="card mt-4">
                <Button label="Nouvelle Catégorie" icon="pi pi-plus" className="p-button-success mb-4" onClick={openNew} />
                <DataTable value={categories} size="small" responsiveLayout="scroll">
                    <Column field="name" header="Nom" sortable />
                    <Column header="Couleur" body={colorBodyTemplate} style={{width: '8rem', textAlign: 'center'}} />
                    <Column header="Suivi Mensuel" body={trackedBodyTemplate} style={{width: '10rem', textAlign: 'center'}} />
                    <Column body={actionBodyTemplate} style={{width: '5rem', textAlign: 'center'}}/>
                </DataTable>
            </div>

            <Dialog visible={isDialogVisible} style={{ width: '450px' }} header="Nouvelle Catégorie" modal onHide={hideDialog} footer={dialogFooter}>
                <div className="field"><label htmlFor="name">Nom</label><InputText id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
                <div className="field mt-4"><label htmlFor="color" className="block mb-2">Couleur</label><ColorPicker id="color" value={color} onChange={(e) => setColor(e.value)} /></div>
                <div className="field flex align-items-center mt-4"><InputSwitch id="isTracked" checked={isTracked} onChange={(e) => setIsTracked(e.value)} /><label htmlFor="isTracked" className="ml-2">Suivre mensuellement dans les budgets</label></div>
            </Dialog>
        </div>
    );
};

export default CategoriesPage;