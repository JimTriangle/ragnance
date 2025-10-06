import { useContext, useEffect, useRef } from 'react';
import {
  TransactionRefreshContext,
  TRANSACTION_REFRESH_EVENT,
  TRANSACTION_REFRESH_STORAGE_KEY
} from '../context/TransactionRefreshContext';

const useTransactionRefresh = (onRefresh) => {
  const { lastRefresh } = useContext(TransactionRefreshContext);
  const initialRenderRef = useRef(true);
  const lastHandledEventRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof onRefresh !== 'function') {
      return undefined;
    }

    const eventHandler = (event) => {
      if (event?.detail != null) {
        lastHandledEventRef.current = event.detail;
      }
      onRefresh();
    };

    const storageHandler = (event) => {
      if (event.key === TRANSACTION_REFRESH_STORAGE_KEY) {
        onRefresh();
      }
    };

    window.addEventListener(TRANSACTION_REFRESH_EVENT, eventHandler);
    window.addEventListener('storage', storageHandler);

    return () => {
      window.removeEventListener(TRANSACTION_REFRESH_EVENT, eventHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [onRefresh]);

  useEffect(() => {
    if (typeof onRefresh !== 'function') {
      return;
    }

    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (lastHandledEventRef.current && lastHandledEventRef.current === lastRefresh) {
      lastHandledEventRef.current = null;
      return;
    }

    onRefresh();
  }, [lastRefresh, onRefresh]);
};

export default useTransactionRefresh;