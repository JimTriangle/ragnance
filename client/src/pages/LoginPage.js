import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import ThemeToggle from '../components/ThemeToggle';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { storeToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      storeToken(response.data.authToken);

      const decoded = jwtDecode(response.data.authToken);
      // --- LOGIQUE DE REDIRECTION INTELLIGENTE ---
      // 1. On regarde si une destination a été sauvegardée
      const redirectTo = sessionStorage.getItem('postLoginRedirect');

      // 2. On nettoie la session pour les prochaines fois
      sessionStorage.removeItem('postLoginRedirect');
      if (redirectTo) {
        navigate(redirectTo);
      } else if (decoded.budgetAccess) {
        navigate('/budget/dashboard');
      } else if (decoded.tradingAccess) {
        navigate('/trading');
      } else {
        navigate('/');
      }
      // 3. On redirige vers la destination, ou vers le dashboard Budget par défaut
      navigate(redirectTo || '/budget/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
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
               <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              <label htmlFor="email">Email</label>
            </span>
          </div>
          <div className="field">
            <span className="p-float-label">
              <Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} feedback={false} toggleMask autoComplete="current-password" />
              <label htmlFor="password">Mot de passe</label>
            </span>
          </div>
          {error && <Message severity="error" text={error} />}
          <Button type="submit" label="Se connecter" className="mt-2" />
        </form>
        <div className="mt-3 text-center">
          <Link to="/">Retour à l'accueil</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;