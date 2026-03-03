import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import ThemeToggle from '../components/ThemeToggle';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { storeToken } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Tentative de connexion...');
      const response = await api.post('/auth/login', { email, password, rememberMe });
      
      console.log('✅ Connexion réussie, stockage du token...');
      
      // Stocker le token
      const success = storeToken(response.data.authToken);
      
      if (!success) {
        setError('Erreur lors de la configuration de la session');
        setIsLoading(false);
        return;
      }

      const decoded = jwtDecode(response.data.authToken);
      
      // Attendre un peu pour que l'événement auth:login soit bien dispatché
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Récupérer la destination sauvegardée
      const redirectTo = sessionStorage.getItem('postLoginRedirect');
      sessionStorage.removeItem('postLoginRedirect');
      
      console.log('🚀 Navigation vers:', redirectTo || 'destination par défaut');
      
      // NOUVELLE APPROCHE : Forcer un refresh de la page après navigation
      // Cela garantit que tous les composants se rechargent avec le nouveau token
      if (redirectTo && redirectTo !== '/trading') {
        // Bloquer la redirection vers /trading (accès désactivé)
        window.location.href = redirectTo;
      } else if (decoded.budgetAccess) {
        window.location.href = '/budget/dashboard';
      } /* MASQUÉ: Accès au trading désactivé
      else if (decoded.tradingAccess) {
        window.location.href = '/trading';
      } */ else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('❌ Erreur de connexion:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-content-center align-items-center" style={{ height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <Card title="Connexion" style={{ width: '25rem' }}>
        <form onSubmit={handleLogin} className="p-fluid">
          <div className="field">
            <span className="p-float-label">
               <InputText 
                 id="email" 
                 value={email} 
                 onChange={(e) => setEmail(e.target.value)} 
                 autoComplete="username"
                 disabled={isLoading}
               />
              <label htmlFor="email">Email</label>
            </span>
          </div>
          <div className="field">
            <span className="p-float-label">
              <Password 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                feedback={false} 
                toggleMask 
                autoComplete="current-password"
                disabled={isLoading}
              />
              <label htmlFor="password">Mot de passe</label>
            </span>
          </div>
          <div className="field-checkbox mb-3">
            <Checkbox
              inputId="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.checked)}
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="ml-2" style={{ cursor: 'pointer' }}>
              Se souvenir de moi pendant 30 jours
            </label>
          </div>
          {error && <Message severity="error" text={error} />}
          <Button 
            type="submit" 
            label={isLoading ? "Connexion en cours..." : "Se connecter"} 
            className="mt-2"
            disabled={isLoading}
            icon={isLoading ? "pi pi-spin pi-spinner" : undefined}
          />
        </form>
        <div className="mt-3 text-center">
          <Link to="/">Retour à l'accueil</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;