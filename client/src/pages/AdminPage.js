import React, { useState, useEffect, useRef } from 'react'; // CORRECTION ICI
import api from '../services/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputTextarea } from 'primereact/inputtextarea';
import { Badge } from 'primereact/badge';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userData, setUserData] = useState({ email: '', password: '', role: 'user', budgetAccess: false, tradingAccess: false });
    const toast = useRef(null);
    const [sqlQuery, setSqlQuery] = useState('');
    const [sqlResult, setSqlResult] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableSchema, setTableSchema] = useState(null);
    const [newsletterSubject, setNewsletterSubject] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [announcements, setAnnouncements] = useState([]);
    const [isAnnouncementDialogVisible, setIsAnnouncementDialogVisible] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [announcementData, setAnnouncementData] = useState({ title: '', content: '', type: 'feature', publishNow: false });
    const [contactEmail, setContactEmail] = useState('');
    const [privacyEmail, setPrivacyEmail] = useState('');
    const roles = [{ label: 'Utilisateur', value: 'user' }, { label: 'Admin', value: 'admin' }];
    const announcementTypes = [
        { label: 'Nouvelle fonctionnalité', value: 'feature' },
        { label: 'Information', value: 'info' },
        { label: 'Avertissement', value: 'warning' },
        { label: 'Mise à jour', value: 'update' }
    ];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) { console.error("Erreur fetch users", error); }
        finally { setLoading(false); }
    };

    const fetchTables = async () => {
        try {
            const response = await api.get('/admin/schema');
            setTables(response.data.map(name => ({ label: name, value: name })));
        } catch (error) { console.error('Erreur fetch tables', error); }
    };

    const fetchTableSchema = async (table) => {
        if (!table) {
            setTableSchema(null);
            return;
        }
        try {
            const response = await api.get(`/admin/schema?table=${table}`);
            setTableSchema(response.data);
        } catch (error) { console.error('Erreur fetch table schema', error); }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements/admin/all');
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Erreur fetch announcements', error);
        }
    };

    const fetchConfigEmails = async () => {
        try {
            const response = await api.get('/config/emails');
            setContactEmail(response.data.contact || '');
            setPrivacyEmail(response.data.privacy || '');
        } catch (error) {
            console.error('Erreur fetch config emails', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchTables();
        fetchAnnouncements();
        fetchConfigEmails();
    }, []);

    useEffect(() => {
        fetchTableSchema(selectedTable);
    }, [selectedTable]);

    const openNew = () => {
        setSelectedUser(null);
        setUserData({ email: '', password: '', role: 'user', budgetAccess: false, tradingAccess: false });
        setIsDialogVisible(true);
    };

    const editUser = (user) => {
        setSelectedUser(user);
        setUserData({ ...user, password: '' });
        setIsDialogVisible(true);
    };

    const hideDialog = () => setIsDialogVisible(false);

    const handleInputChange = (e, name) => {
        const val = e.target.value;
        setUserData({ ...userData, [name]: val });
    };

    const saveUser = async () => {
        try {
            if (selectedUser) {
                await api.put(`/admin/users/${selectedUser.id}`, { email: userData.email, role: userData.role, budgetAccess: userData.budgetAccess, tradingAccess: userData.tradingAccess });
            } else {
                await api.post('/admin/users', userData);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur créé' });
            }
            fetchUsers();
            hideDialog();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const executeSQL = async () => {
        try {
            const response = await api.post('/admin/sql', { query: sqlQuery });
            setSqlResult(response.data.results);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const sendNewsletter = async () => {
        try {
            await api.post('/admin/newsletter', { subject: newsletterSubject, message: newsletterMessage });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Newsletter envoyée' });
            setNewsletterSubject('');
            setNewsletterMessage('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const openNewAnnouncement = () => {
        setSelectedAnnouncement(null);
        setAnnouncementData({ title: '', content: '', type: 'feature', publishNow: false });
        setIsAnnouncementDialogVisible(true);
    };

    const editAnnouncement = (announcement) => {
        setSelectedAnnouncement(announcement);
        setAnnouncementData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            publishNow: false
        });
        setIsAnnouncementDialogVisible(true);
    };

    const saveAnnouncement = async () => {
        try {
            if (selectedAnnouncement) {
                await api.put(`/announcements/admin/${selectedAnnouncement.id}`, announcementData);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Annonce modifiée' });
            } else {
                await api.post('/announcements/admin', announcementData);
                toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Annonce créée' });
            }
            fetchAnnouncements();
            setIsAnnouncementDialogVisible(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const deleteAnnouncement = async (id) => {
        try {
            await api.delete(`/announcements/admin/${id}`);
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Annonce supprimée' });
            fetchAnnouncements();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const publishAnnouncement = async (id) => {
        try {
            await api.put(`/announcements/admin/${id}`, { publishedAt: new Date() });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Annonce publiée' });
            fetchAnnouncements();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const saveConfigEmails = async () => {
        try {
            await api.put('/config/emails', { contact: contactEmail, privacy: privacyEmail });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Emails de configuration mis à jour' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
    };

    const renderSqlResult = () => {
        if (!Array.isArray(sqlResult) || sqlResult.length === 0) return null;
        const columns = Object.keys(sqlResult[0]);
        return (
            <DataTable value={sqlResult} className="mt-4">
                {columns.map(col => (
                    <Column key={col} field={col} header={col} />
                ))}
            </DataTable>
        );
    };
    const deleteUser = (userId) => {
        confirmDialog({
            message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.',
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            accept: async () => {
                try {
                    await api.delete(`/admin/users/${userId}`);
                    toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé' });
                    fetchUsers();
                } catch (error) {
                    toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
                }
            }
        });
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-button-sm" onClick={() => editUser(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteUser(rowData.id)} />
        </div>
    );

    const dialogFooter = (<div><Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} /><Button label="Sauvegarder" icon="pi pi-check" onClick={saveUser} /></div>);

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <h1>Panel d'Administration</h1>
            <TabView>
                <TabPanel header="Utilisateurs">
                    <div className="card mt-4">
                        <div className="flex justify-content-between align-items-center mb-4">
                            <h2 className="text-xl m-0">Gestion des utilisateurs</h2>
                            <Button label="Nouvel Utilisateur" icon="pi pi-plus" className="p-button-success" onClick={openNew} />
                        </div>
                        <DataTable value={users} loading={loading} size="small">
                            <Column field="id" header="ID" sortable />
                            <Column field="email" header="Email" sortable />
                            <Column field="role" header="Rôle" sortable />
                            <Column field="budgetAccess" header="Budget" sortable />
                            <Column field="tradingAccess" header="Trading" sortable />
                            <Column field="createdAt" header="Créé le" body={(rowData) => new Date(rowData.createdAt).toLocaleDateString('fr-FR')} sortable />
                            <Column field="lastLogin" header="Dernière connexion" body={(rowData) => rowData.lastLogin ? new Date(rowData.lastLogin).toLocaleString('fr-FR') : ''} sortable />
                            <Column body={actionBodyTemplate} header="Actions" />
                        </DataTable>
                    </div>

                    <Dialog visible={isDialogVisible} style={{ width: '450px' }} header="Détails de l'utilisateur" modal onHide={hideDialog} footer={dialogFooter}>
                        <div className="field mt-3"><span className="p-float-label"><InputText id="email" value={userData.email} onChange={(e) => handleInputChange(e, 'email')} /><label htmlFor="email">Email</label></span></div>
                        {!selectedUser && (<div className="field mt-4"><span className="p-float-label"><Password id="password" value={userData.password} onChange={(e) => handleInputChange(e, 'password')} toggleMask /><label htmlFor="password">Mot de passe</label></span></div>)}
                        <div className="field mt-4"><label htmlFor="role">Rôle</label><Dropdown id="role" value={userData.role} options={roles} onChange={(e) => handleInputChange(e, 'role')} /></div>
                        <div className="field mt-4 flex align-items-center">
                            <Checkbox inputId="budgetAccess" checked={userData.budgetAccess} onChange={(e) => setUserData({ ...userData, budgetAccess: e.checked })} />
                            <label htmlFor="budgetAccess" className="ml-2">Accès Budget</label>
                        </div>
                        <div className="field mt-2 flex align-items-center">
                            <Checkbox inputId="tradingAccess" checked={userData.tradingAccess} onChange={(e) => setUserData({ ...userData, tradingAccess: e.checked })} />
                            <label htmlFor="tradingAccess" className="ml-2">Accès Trading</label>
                        </div>
                    </Dialog>
                </TabPanel>

                <TabPanel header="SQL">
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <h2>Schéma de la base</h2>
                            <Dropdown
                                value={selectedTable}
                                options={tables}
                                onChange={(e) => setSelectedTable(e.value)}
                                placeholder="Sélectionnez une table"
                                className="w-full mb-3"
                            />
                            {tableSchema && (
                                <div className="mb-3">
                                    <h3>{tableSchema.name}</h3>
                                    <ul className="ml-3">
                                        {tableSchema.columns.map((col) => (
                                            <li key={col.name}>{col.name} - {col.type}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="col-12 md:col-8">
                            <h2>Exécuter une requête</h2>
                            <InputTextarea value={sqlQuery} rows={5} className="w-full" onChange={(e) => setSqlQuery(e.target.value)} />
                            <Button label="Exécuter" className="mt-2" onClick={executeSQL} />
                            {renderSqlResult()}
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Newsletter">
                    <div className="card mt-4">
                        <div className="field">
                            <span className="p-float-label">
                                <InputText id="subject" value={newsletterSubject} onChange={(e) => setNewsletterSubject(e.target.value)} className="w-full" />
                                <label htmlFor="subject">Sujet</label>
                            </span>
                        </div>
                        <div className="field mt-4">
                            <InputTextarea value={newsletterMessage} rows={5} className="w-full" onChange={(e) => setNewsletterMessage(e.target.value)} />
                        </div>
                        <Button label="Envoyer" className="mt-2" onClick={sendNewsletter} />
                    </div>
                </TabPanel>
                <TabPanel header="Annonces">
                    <div className="card mt-4">
                        <div className="flex justify-content-between align-items-center mb-4">
                            <h2 className="text-xl m-0">Gestion des annonces</h2>
                            <Button label="Nouvelle Annonce" icon="pi pi-plus" className="p-button-success" onClick={openNewAnnouncement} />
                        </div>
                        <DataTable value={announcements} size="small">
                            <Column field="id" header="ID" sortable style={{ width: '5%' }} />
                            <Column field="title" header="Titre" sortable />
                            <Column field="type" header="Type" sortable body={(rowData) => {
                                const typeLabels = { feature: 'Fonctionnalité', info: 'Info', warning: 'Avertissement', update: 'Mise à jour' };
                                return <Badge value={typeLabels[rowData.type] || rowData.type} severity={rowData.type === 'feature' ? 'success' : rowData.type === 'warning' ? 'warning' : 'info'} />;
                            }} />
                            <Column field="publishedAt" header="Statut" sortable body={(rowData) => (
                                rowData.publishedAt ?
                                    <Badge value="Publiée" severity="success" /> :
                                    <Badge value="Brouillon" severity="secondary" />
                            )} />
                            <Column field="createdAt" header="Créée le" body={(rowData) => new Date(rowData.createdAt).toLocaleDateString('fr-FR')} sortable />
                            <Column header="Actions" body={(rowData) => (
                                <div className="flex gap-2">
                                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-button-sm" onClick={() => editAnnouncement(rowData)} />
                                    {!rowData.publishedAt && (
                                        <Button icon="pi pi-send" className="p-button-rounded p-button-info p-button-sm" onClick={() => publishAnnouncement(rowData.id)} tooltip="Publier" tooltipOptions={{ position: 'top' }} />
                                    )}
                                    <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => deleteAnnouncement(rowData.id)} />
                                </div>
                            )} />
                        </DataTable>
                    </div>

                    <Dialog
                        visible={isAnnouncementDialogVisible}
                        style={{ width: '650px' }}
                        header={selectedAnnouncement ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
                        modal
                        onHide={() => setIsAnnouncementDialogVisible(false)}
                        footer={
                            <div>
                                <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={() => setIsAnnouncementDialogVisible(false)} />
                                <Button label="Sauvegarder" icon="pi pi-check" onClick={saveAnnouncement} />
                            </div>
                        }
                    >
                        <div className="field mt-3">
                            <span className="p-float-label">
                                <InputText
                                    id="title"
                                    value={announcementData.title}
                                    onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })}
                                    className="w-full"
                                />
                                <label htmlFor="title">Titre</label>
                            </span>
                        </div>
                        <div className="field mt-4">
                            <label htmlFor="type" className="block mb-2">Type d'annonce</label>
                            <Dropdown
                                id="type"
                                value={announcementData.type}
                                options={announcementTypes}
                                onChange={(e) => setAnnouncementData({ ...announcementData, type: e.value })}
                                className="w-full"
                            />
                        </div>
                        <div className="field mt-4">
                            <label htmlFor="content" className="block mb-2">Contenu (Markdown supporté)</label>
                            <InputTextarea
                                id="content"
                                value={announcementData.content}
                                onChange={(e) => setAnnouncementData({ ...announcementData, content: e.target.value })}
                                rows={10}
                                className="w-full"
                            />
                        </div>
                        {!selectedAnnouncement && (
                            <div className="field mt-4 flex align-items-center">
                                <Checkbox
                                    inputId="publishNow"
                                    checked={announcementData.publishNow}
                                    onChange={(e) => setAnnouncementData({ ...announcementData, publishNow: e.checked })}
                                />
                                <label htmlFor="publishNow" className="ml-2">Publier immédiatement</label>
                            </div>
                        )}
                    </Dialog>
                </TabPanel>
                <TabPanel header="Configuration Emails">
                    <div className="card mt-4">
                        <h2 className="text-xl mb-4">Emails de configuration</h2>
                        <p className="text-sm text-color-secondary mb-4">
                            Configurez les adresses email utilisées sur la plateforme.
                        </p>
                        <div className="field">
                            <span className="p-float-label">
                                <InputText
                                    id="contactEmail"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full"
                                />
                                <label htmlFor="contactEmail">Email de contact</label>
                            </span>
                            <small className="text-color-secondary">
                                Email de destination pour les messages de contact des utilisateurs
                            </small>
                        </div>
                        <div className="field mt-4">
                            <span className="p-float-label">
                                <InputText
                                    id="privacyEmail"
                                    value={privacyEmail}
                                    onChange={(e) => setPrivacyEmail(e.target.value)}
                                    className="w-full"
                                />
                                <label htmlFor="privacyEmail">Email Privacy Policy</label>
                            </span>
                            <small className="text-color-secondary">
                                Email affiché en bas de la page Privacy Policy
                            </small>
                        </div>
                        <Button
                            label="Sauvegarder"
                            icon="pi pi-check"
                            className="mt-4"
                            onClick={saveConfigEmails}
                        />
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
};

export default AdminPage;