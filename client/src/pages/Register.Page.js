import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

// Composants PrimeReact
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
        setError('Email et mot de passe sont requis.');
        return;
    }

    try {
      const response = await api.post('/auth/register', { email, password });
      setSuccess(response.data.message + " Vous pouvez maintenant vous connecter.");
      // Redirige vers la page de connexion après 3 secondes
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <Card title="Créer un compte Ragnance" style={{ width: '25rem' }}>
        <form onSubmit={handleRegister} className="p-fluid">
          <div className="field">
            <span className="p-float-label">
              <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="email">Email</label>
            </span>
          </div>
          <div className="field">
            <span className="p-float-label">
              <Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} feedback={false} toggleMask/>
              <label htmlFor="password">Mot de passe</label>
            </span>
          </div>
          {error && <Message severity="error" text={error} />}
          {success && <Message severity="success" text={success} />}
          <Button type="submit" label="S'inscrire" className="mt-2" />
        </form>
        <div className="mt-3 text-center">
            <Link to="/login">Déjà un compte ? Se connecter</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;