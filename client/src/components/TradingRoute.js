import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';

const TradingRoute = () => {
  const { isLoggedIn, user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="p-3" style={{ height: '100vh' }}>
        <Skeleton width="10rem" height="2rem" className="mb-4" />
        <div className="grid">
          <div className="col-12 md:col-6"><Skeleton height="15rem" /></div>
          <div className="col-12 md:col-6"><Skeleton height="15rem" /></div>
        </div>
        <Skeleton height="20rem" className="mt-4" />
      </div>
    );
  }

  return isLoggedIn && user?.tradingAccess ? <Outlet /> : <Navigate to="/" />;
};

export default TradingRoute;