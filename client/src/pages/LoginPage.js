import React, { useState, useContext } from 'react';
import { useNavigate  } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Composants PrimeReact
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

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
      // ON UTILISE L'INSTANCE 'api' AU LIEU DE 'axios'
      const response = await api.post('/auth/login', { email, password });
      storeToken(response.data.authToken);
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <Card title="Connexion à Ragnance" style={{ width: '25rem' }}>
        <form onSubmit={handleLogin} className="p-fluid">
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <Button type="submit" label="Se connecter" className="mt-2" />
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;