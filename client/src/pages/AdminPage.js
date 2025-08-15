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

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userData, setUserData] = useState({ email: '', password: '', role: 'user', budgetAccess: false, tradingAccess: false });
    const toast = useRef(null);
    const [sqlQuery, setSqlQuery] = useState('');
    const [sqlResult, setSqlResult] = useState([]);
    const [schema, setSchema] = useState([]);
    const roles = [{ label: 'Utilisateur', value: 'user' }, { label: 'Admin', value: 'admin' }];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) { console.error("Erreur fetch users", error); }
        finally { setLoading(false); }
    };

    const fetchSchema = async () => {
        try {
            const response = await api.get('/admin/schema');
            setSchema(response.data);
        } catch (error) { console.error('Erreur fetch schema', error); }
    };

    useEffect(() => {
        fetchUsers();
        fetchSchema();
    }, []);
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
    const deleteUser = async (userId) => {
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.current.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé' });
            fetchUsers();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Échec' });
        }
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
                            {schema.map((table) => (
                                <div key={table.name} className="mb-3">
                                    <h3>{table.name}</h3>
                                    <ul className="ml-3">
                                        {table.columns.map((col) => (
                                            <li key={col.name}>{col.name} - {col.type}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="col-12 md:col-8">
                            <h2>Exécuter une requête</h2>
                            <InputTextarea value={sqlQuery} rows={5} className="w-full" onChange={(e) => setSqlQuery(e.target.value)} />
                            <Button label="Exécuter" className="mt-2" onClick={executeSQL} />
                            {renderSqlResult()}
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
};

export default AdminPage;