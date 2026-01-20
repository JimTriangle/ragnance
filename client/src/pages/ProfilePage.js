import React, { useState, useRef, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Card } from 'primereact/card';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Champs de contact structurés
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('');
    const [isLoadingContact, setIsLoadingContact] = useState(true);

    // Formulaire de contact Ragnance
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const toast = useRef(null);

    useEffect(() => {
        const fetchContact = async () => {
            try {
                const response = await api.get('/auth/contact');
                const contactData = response.data.contact || {};
                setPhone(contactData.phone || '');
                setAddress(contactData.address || '');
                setCity(contactData.city || '');
                setPostalCode(contactData.postalCode || '');
                setCountry(contactData.country || '');
            } catch (error) {
                console.error('Erreur lors de la récupération du contact:', error);
            } finally {
                setIsLoadingContact(false);
            }
        };
        fetchContact();
    }, []);

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

    const handleSaveContact = async () => {
        try {
            const response = await api.put('/auth/update-contact', {
                phone,
                address,
                city,
                postalCode,
                country
            });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: response.data.message, life: 3000 });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Une erreur est survenue', life: 3000 });
        }
    };

    const handleSendContactMessage = async () => {
        if (!contactSubject || !contactMessage) {
            toast.current.show({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs', life: 3000 });
            return;
        }
        try {
            const response = await api.post('/config/contact', { subject: contactSubject, message: contactMessage });
            toast.current.show({ severity: 'success', summary: 'Succès', detail: response.data.message, life: 3000 });
            setContactSubject('');
            setContactMessage('');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Erreur', detail: error.response?.data?.message || 'Une erreur est survenue', life: 3000 });
        }
    };

    return (
        <div className="p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Toast ref={toast} />
            <h1 className="mb-4">Mon Profil</h1>

            {/* Section 1: Informations utilisateur */}
            <Card title="Informations utilisateur" className="mb-4">
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <p className="text-color">{user?.email}</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-6">
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-2">Rôle</label>
                            <p className="text-color text-capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Section 2: Contacts utilisateur */}
            <Card title="Mes coordonnées" className="mb-4">
                <p className="text-sm text-color-secondary mb-4">
                    Ces informations permettent à l'équipe de Ragnance de vous contacter si nécessaire.
                </p>
                <div className="p-fluid">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="phone" className="block mb-2">Téléphone</label>
                                <InputText
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={isLoadingContact}
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="postalCode" className="block mb-2">Code postal</label>
                                <InputText
                                    id="postalCode"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    disabled={isLoadingContact}
                                    placeholder="75001"
                                />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="field">
                                <label htmlFor="address" className="block mb-2">Adresse</label>
                                <InputText
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    disabled={isLoadingContact}
                                    placeholder="123 Rue de la Paix"
                                />
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="city" className="block mb-2">Ville</label>
                                <InputText
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    disabled={isLoadingContact}
                                    placeholder="Paris"
                                />
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="country" className="block mb-2">Pays</label>
                                <InputText
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    disabled={isLoadingContact}
                                    placeholder="France"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-3">
                        <Button
                            label="Enregistrer mes coordonnées"
                            icon="pi pi-save"
                            onClick={handleSaveContact}
                            disabled={isLoadingContact}
                        />
                    </div>
                </div>
            </Card>

            {/* Section 3: Contacter Ragnance */}
            <Card title="Contacter l'équipe Ragnance" className="mb-4">
                <p className="text-sm text-color-secondary mb-4">
                    Envoyez un message à l'équipe Ragnance pour toute question ou suggestion.
                </p>
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="contactSubject" className="block mb-2">Sujet</label>
                        <InputText
                            id="contactSubject"
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            placeholder="Objet de votre message"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="contactMessage" className="block mb-2">Message</label>
                        <InputTextarea
                            id="contactMessage"
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            rows={5}
                            placeholder="Votre message..."
                        />
                    </div>
                    <div className="flex justify-content-end mt-3">
                        <Button
                            label="Envoyer le message"
                            icon="pi pi-send"
                            onClick={handleSendContactMessage}
                        />
                    </div>
                </div>
            </Card>

            {/* Section 4: Changement de mot de passe */}
            <Card title="Changer mon mot de passe" className="mb-4">
                <form onSubmit={handleChangePassword} className="p-fluid">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="currentPassword" className="block mb-2">Mot de passe actuel</label>
                                <Password
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    toggleMask
                                    feedback={false}
                                />
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="field">
                                <label htmlFor="newPassword" className="block mb-2">Nouveau mot de passe</label>
                                <Password
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    toggleMask
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-3">
                        <Button
                            type="submit"
                            label="Modifier le mot de passe"
                            icon="pi pi-key"
                        />
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;