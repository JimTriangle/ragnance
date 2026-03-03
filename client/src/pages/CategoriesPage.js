import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import useTour from '../hooks/useTour';
import TourButton from '../components/TourButton';
import '../styles/tour.css';

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [isDialogVisible, setIsDialogVisible] = useState(false);

    // AJOUT : États pour gérer l'édition
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    // États pour le formulaire
    const [name, setName] = useState('');
    const [color, setColor] = useState('CCCCCC');
    const [isTracked, setIsTracked] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);

    // Configuration du guide utilisateur
    const tourSteps = [
        {
            element: '[data-tour-id="categories-title"]',
            popover: {
                title: 'Gestion des Catégories 🏷️',
                description: 'Les catégories vous permettent d\'organiser vos transactions. Créez des catégories personnalisées pour mieux suivre vos dépenses et revenus.',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="add-category-btn"]',
            popover: {
                title: 'Nouvelle Catégorie ➕',
                description: 'Cliquez ici pour créer une nouvelle catégorie. Vous pourrez lui donner un nom, une couleur, et choisir si elle doit être suivie mensuellement.',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="categories-table"]',
            popover: {
                title: 'Liste des Catégories 📋',
                description: 'Toutes vos catégories sont affichées ici avec leur couleur distinctive. Les tags colorés vous aideront à identifier rapidement vos catégories dans les transactions.',
                side: 'top',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="tracked-column"]',
            popover: {
                title: 'Suivi Mensuel 📊',
                description: 'Activez cette option pour qu\'une catégorie soit incluse dans les statistiques et analyses mensuelles. Utile pour suivre vos principales sources de dépenses.',
                side: 'left',
                align: 'center'
            }
        },
        {
            popover: {
                title: 'Astuce 💡',
                description: 'Vous pouvez modifier ou supprimer vos catégories à tout moment. Les catégories bien organisées facilitent l\'analyse de vos finances. Utilisez des couleurs distinctes pour mieux les identifier !',
            }
        }
    ];

    const { startTour } = useTour('categories', tourSteps, true);

    const fetchCategories = useCallback(async () => {
        const response = await api.get('/categories');
        setCategories(response.data);
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    useTransactionRefresh(fetchCategories);

    const openNew = () => {
        setIsEditMode(false);
        setSelectedCategoryId(null);
        setName('');
        setColor('CCCCCC');
        setIsTracked(false);
        setIsDialogVisible(true);
    };

    // AJOUT : Fonction pour ouvrir le dialogue en mode édition
    const editCategory = (category) => {
        setIsEditMode(true);
        setSelectedCategoryId(category.id);
        setName(category.name);
        setColor(category.color.substring(1)); // On retire le '#' pour le ColorPicker
        setIsTracked(category.isTrackedMonthly);
        setIsDialogVisible(true);
    };

    const hideDialog = () => {
        setIsDialogVisible(false);
        setIsEditMode(false);
        setSelectedCategoryId(null);
    };

    // MODIFIÉ : La sauvegarde gère la création ET la modification
    const saveCategory = async () => {
        if (!name) return;

        const payload = { name, color: `#${color}`, isTrackedMonthly: isTracked };

        try {
            if (isEditMode) {
                // Si on est en mode édition, on fait un PUT
                await api.put(`/categories/${selectedCategoryId}`, payload);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie modifiée' });
            } else {
                // Sinon, on fait un POST pour créer
                await api.post('/categories', payload);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie créée' });
            }
            fetchCategories();
            hideDialog();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'L\'opération a échoué' });
        }
    };

    const deleteCategory = (categoryId) => {
        const performDelete = async () => {
            try {
                await api.delete(`/categories/${categoryId}`);
                fetchCategories();
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Catégorie supprimée' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La suppression a échoué' });
            }
        };
        confirmDialog({
            message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: performDelete
        });
    };

    const onTrackedChange = async (e, category) => {
        const updatedCategory = { ...category, isTrackedMonthly: e.value };
        try {
            await api.put(`/categories/${category.id}`, updatedCategory);
            setCategories(prev => prev.map(c => (c.id === category.id ? updatedCategory : c)));
            toast.current.show({ severity: 'info', summary: 'Mise à jour', detail: 'Suivi mensuel modifié', life: 2000 });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'La mise à jour a échoué' });
        }
    };

    const trackedBodyTemplate = (rowData) => {
        return <InputSwitch checked={rowData.isTrackedMonthly} onChange={(e) => onTrackedChange(e, rowData)} />;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-button-sm" onClick={() => editCategory(rowData)} aria-label="Modifier la catégorie" />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteCategory(rowData.id)} aria-label="Supprimer la catégorie" />
            </div>
        );
    };

    const nameBodyTemplate = (rowData) => <Tag value={rowData.name} style={{ background: rowData.color }} />;

    const dialogFooter = (<div><Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} /><Button label="Sauvegarder" icon="pi pi-check" onClick={saveCategory} /></div>);

    // MODIFIÉ : Le titre du dialogue est maintenant dynamique
    const dialogTitle = isEditMode ? "Modifier la Catégorie" : "Nouvelle Catégorie";

    const tableHeader = (
        <div className="flex flex-wrap justify-content-between align-items-center gap-2">
            <Button label="Nouvelle Catégorie" icon="pi pi-plus" className="p-button-success p-button-sm" onClick={openNew} data-tour-id="add-category-btn" />
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher..." className="p-inputtext-sm" />
            </span>
        </div>
    );

    return (
        <div className="p-4">
            <TourButton onStartTour={startTour} tooltip="Revoir le guide des Catégories" />
            <Toast ref={toast} />
            <h1 data-tour-id="categories-title">Gestion des Catégories</h1>
            <div className="card mt-4" data-tour-id="categories-table">
                <DataTable value={categories} dataKey="id" size="small" responsiveLayout="scroll" header={tableHeader} globalFilter={globalFilter}>
                    <Column field="name" header="Nom" body={nameBodyTemplate} sortable />
                    <Column header="Suivi Mensuel" body={trackedBodyTemplate} style={{ width: '10rem', textAlign: 'center' }} headerStyle={{ textAlign: 'center' }} data-tour-id="tracked-column" />
                    <Column body={actionBodyTemplate} header="Actions" style={{ width: '8rem', textAlign: 'center' }} />
                </DataTable>
            </div>

            <Dialog visible={isDialogVisible} style={{ width: '450px' }} breakpoints={{ '641px': '95vw' }} header={dialogTitle} modal onHide={hideDialog} footer={dialogFooter}>
                <div className="field"><label htmlFor="name">Nom</label><InputText id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
                <div className="field mt-4"><label htmlFor="color" className="block mb-2">Couleur</label><ColorPicker id="color" value={color} onChange={(e) => setColor(e.value)} /></div>
                <div className="field flex align-items-center mt-4"><InputSwitch id="isTracked" checked={isTracked} onChange={(e) => setIsTracked(e.value)} /><label htmlFor="isTracked" className="ml-2">Suivre mensuellement dans les budgets</label></div>
            </Dialog>
        </div>
    );
};

export default CategoriesPage;