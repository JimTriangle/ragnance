import React, { useState, useRef, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Card } from 'primereact/card';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const toast = useRef(null);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/auth/change-password', { currentPassword, newPassword });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: response.data.message, life: 3000 });
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Une erreur est survenue', life: 3000 });
        }
    };
    
    return (
        <div className="p-4 col-4">
            <Toast ref={toast} />
            <h1>Mon Profil</h1>
            <Card className="mt-4">
                <div className="mb-4">
                    <p><strong>Email :</strong> {user?.email}</p>
                    <p><strong>Rôle :</strong> {user?.role}</p>
                </div>

                <Divider />

                <form onSubmit={handleChangePassword} className="mt-4 p-fluid">
                    <h2 className="text-xl">Changer mon mot de passe</h2>
                    <div className="field">
                        <span className="p-float-label">
                            <Password id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} toggleMask />
                            <label htmlFor="currentPassword">Mot de passe actuel</label>
                        </span>
                    </div>
                    <div className="field">
                        <span className="p-float-label">
                            <Password id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} toggleMask />
                            <label htmlFor="newPassword">Nouveau mot de passe</label>
                        </span>
                    </div>
                    <Button type="submit" label="Modifier le mot de passe" className="p-button-sm" />
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;