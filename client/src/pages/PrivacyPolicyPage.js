import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import './PrivacyPolicyPage.css';
import ThemeToggle from '../components/ThemeToggle';
import api from '../services/api';

const PrivacyPolicyPage = () => {
    const navigate = useNavigate();
    const [privacyEmail, setPrivacyEmail] = useState('privacy@ragnance.com');

    useEffect(() => {
        const fetchPrivacyEmail = async () => {
            try {
                const response = await api.get('/config/emails');
                if (response.data.privacy) {
                    setPrivacyEmail(response.data.privacy);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'email privacy:', error);
            }
        };
        fetchPrivacyEmail();
    }, []);

    return (
        <div className="privacy-policy-container">
            <header className="privacy-policy-header">
                <div className="flex justify-content-between align-items-center">
                    <Button
                        icon="pi pi-arrow-left"
                        label="Retour"
                        onClick={() => navigate('/')}
                        className="p-button-text"
                    />
                    <ThemeToggle />
                </div>
                <h1>Politique de Confidentialité</h1>
                <p className="update-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
            </header>

            <main className="privacy-policy-main">
                <Card>
                    <section>
                        <h2>1. Introduction</h2>
                        <p>
                            Bienvenue sur Ragnance. Nous prenons la protection de vos données personnelles très au sérieux.
                            Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons
                            vos informations personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
                        </p>
                    </section>

                    <section>
                        <h2>2. Responsable du traitement des données</h2>
                        <p>
                            Le responsable du traitement des données pour Ragnance est l'opérateur de cette plateforme.
                            Pour toute question concernant vos données personnelles, vous pouvez nous contacter via les coordonnées
                            fournies à la fin de cette politique.
                        </p>
                    </section>

                    <section>
                        <h2>3. Données collectées</h2>
                        <p>Nous collectons les types de données suivants :</p>
                        <ul>
                            <li><strong>Données d'identification :</strong> nom d'utilisateur, adresse e-mail, mot de passe (crypté)</li>
                            <li><strong>Données financières :</strong> transactions, budgets, catégories de dépenses, objectifs d'épargne</li>
                            <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, données de session</li>
                            <li><strong>Données d'utilisation :</strong> pages visitées, fonctionnalités utilisées, préférences</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Finalités du traitement</h2>
                        <p>Vos données personnelles sont utilisées pour :</p>
                        <ul>
                            <li>Fournir et améliorer nos services de gestion budgétaire</li>
                            <li>Gérer votre compte utilisateur et authentifier vos connexions</li>
                            <li>Traiter vos transactions financières et suivre vos budgets</li>
                            <li>Vous envoyer des notifications importantes concernant votre compte</li>
                            <li>Analyser l'utilisation de la plateforme pour améliorer nos services</li>
                            <li>Assurer la sécurité et prévenir les fraudes</li>
                        </ul>
                    </section>

                    <section>
                        <h2>5. Base juridique du traitement</h2>
                        <p>Le traitement de vos données repose sur :</p>
                        <ul>
                            <li><strong>Votre consentement :</strong> que vous donnez lors de la création de votre compte</li>
                            <li><strong>L'exécution du contrat :</strong> pour fournir les services que vous avez demandés</li>
                            <li><strong>Nos intérêts légitimes :</strong> pour améliorer nos services et assurer la sécurité de la plateforme</li>
                            <li><strong>Obligations légales :</strong> pour respecter les exigences réglementaires applicables</li>
                        </ul>
                    </section>

                    <section>
                        <h2>6. Partage des données</h2>
                        <p>
                            Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.
                            Vos données peuvent être partagées uniquement dans les cas suivants :
                        </p>
                        <ul>
                            <li><strong>Fournisseurs de services :</strong> hébergement, services cloud, sous réserve d'accords de confidentialité stricts</li>
                            <li><strong>Obligations légales :</strong> si requis par la loi ou une autorité compétente</li>
                        </ul>
                    </section>

                    <section>
                        <h2>7. Sécurité des données</h2>
                        <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :</p>
                        <ul>
                            <li>Cryptage des données sensibles (mots de passe)</li>
                            <li>Connexions sécurisées via HTTPS</li>
                            <li>Contrôles d'accès stricts aux données</li>
                            <li>Surveillance et audits de sécurité réguliers</li>
                            <li>Sauvegardes régulières des données</li>
                        </ul>
                    </section>

                    <section>
                        <h2>8. Conservation des données</h2>
                        <p>
                            Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services
                            et conformément aux obligations légales. Lorsque vous supprimez votre compte, vos données sont
                            supprimées dans un délai raisonnable, sauf si nous sommes légalement tenus de les conserver plus longtemps.
                        </p>
                    </section>

                    <section>
                        <h2>9. Vos droits</h2>
                        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                        <ul>
                            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                            <li><strong>Droit de rectification :</strong> corriger les données inexactes ou incomplètes</li>
                            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                            <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
                            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                            <li><strong>Droit de retirer votre consentement :</strong> à tout moment</li>
                        </ul>
                        <p>
                            Pour exercer ces droits, contactez-nous via les coordonnées fournies ci-dessous.
                        </p>
                    </section>

                    <section>
                        <h2>10. Cookies et technologies similaires</h2>
                        <p>
                            Nous utilisons des cookies et technologies similaires pour améliorer votre expérience,
                            gérer vos sessions et analyser l'utilisation de la plateforme. Vous pouvez gérer vos
                            préférences de cookies dans les paramètres de votre navigateur.
                        </p>
                    </section>

                    <section>
                        <h2>11. Transferts internationaux de données</h2>
                        <p>
                            Vos données sont hébergées et traitées au sein de l'Union européenne. Si nous devons
                            transférer vos données hors de l'UE, nous veillons à ce que des garanties appropriées
                            soient en place conformément au RGPD.
                        </p>
                    </section>

                    <section>
                        <h2>12. Mineurs</h2>
                        <p>
                            Nos services ne sont pas destinés aux personnes de moins de 18 ans. Nous ne collectons
                            pas sciemment de données personnelles auprès de mineurs.
                        </p>
                    </section>

                    <section>
                        <h2>13. Modifications de cette politique</h2>
                        <p>
                            Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Nous vous
                            informerons de tout changement important via une notification sur la plateforme ou par e-mail.
                            La date de dernière mise à jour est indiquée en haut de cette page.
                        </p>
                    </section>

                    <section>
                        <h2>14. Réclamations</h2>
                        <p>
                            Si vous estimez que vos droits ne sont pas respectés, vous avez le droit de déposer
                            une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL)
                            ou de l'autorité de protection des données compétente dans votre pays.
                        </p>
                    </section>

                    <section>
                        <h2>15. Contact</h2>
                        <p>
                            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
                            veuillez nous contacter :
                        </p>
                        <ul>
                            <li><strong>Par e-mail :</strong> {privacyEmail}</li>
                            <li><strong>Via votre profil :</strong> utilisez la fonction de contact dans votre espace utilisateur</li>
                        </ul>
                    </section>
                </Card>
            </main>
        </div>
    );
};

export default PrivacyPolicyPage;
