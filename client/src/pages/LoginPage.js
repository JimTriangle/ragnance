import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import ThemeToggle from '../components/ThemeToggle';
import { jwtDecode } from 'jwt-decode';
import '../styles/login.css';

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
      const response = await api.post('/auth/login', { email, password, rememberMe });

      const success = storeToken(response.data.authToken);

      if (!success) {
        setError('Erreur lors de la configuration de la session');
        setIsLoading(false);
        return;
      }

      const decoded = jwtDecode(response.data.authToken);

      const redirectTo = sessionStorage.getItem('postLoginRedirect');
      sessionStorage.removeItem('postLoginRedirect');

      if (redirectTo && redirectTo !== '/trading') {
        window.location.href = redirectTo;
      } else if (decoded.budgetAccess) {
        window.location.href = '/budget/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Panneau décoratif gauche */}
      <div className="login-side">
        <div className="login-side-bg" aria-hidden="true">
          <div className="login-side-orb login-side-orb--1"></div>
          <div className="login-side-orb login-side-orb--2"></div>
        </div>
        <div className="login-side-content">
          <img src="/logo192.png" alt="Ragnance Logo" className="login-side-logo" />
          <h2 className="login-side-title">Ragnance</h2>
          <p className="login-side-subtitle">Vos finances, simplifiées et maîtrisées.</p>
        </div>
      </div>

      {/* Panneau formulaire */}
      <div className="login-form-panel">
        <div className="login-form-toggle">
          <ThemeToggle />
        </div>
        <div className="login-form-wrapper">
          <div className="login-form-header">
            {/* Logo visible uniquement en mobile (quand le side panel est masqué) */}
            <img src="/logo192.png" alt="Ragnance" className="login-form-logo-mobile" />
            <h1 className="login-form-title">Connexion</h1>
            <p className="login-form-desc">Connectez-vous pour accéder à votre espace</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="email" className="login-label">Email</label>
              <InputText
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
                placeholder="votre@email.com"
                className="login-input"
              />
            </div>
            <div className="login-field">
              <label htmlFor="password" className="login-label">Mot de passe</label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                feedback={false}
                toggleMask
                autoComplete="current-password"
                disabled={isLoading}
                placeholder="Votre mot de passe"
                className="login-input"
              />
            </div>
            <div className="login-remember">
              <Checkbox
                inputId="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.checked)}
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="login-remember-label">
                Se souvenir de moi pendant 30 jours
              </label>
            </div>
            {error && (
              <div className="login-error">
                <Message severity="error" text={error} className="w-full" />
              </div>
            )}
            <Button
              type="submit"
              label={isLoading ? "Connexion en cours..." : "Se connecter"}
              disabled={isLoading}
              icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
              className="login-submit"
            />
          </form>
          <div className="login-footer-link">
            <Link to="/">
              <i className="pi pi-arrow-left"></i> Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
