import { useCallback, useContext, useEffect, useRef } from 'react';

import {
  TransactionRefreshContext,
  TRANSACTION_REFRESH_EVENT,
  TRANSACTION_REFRESH_STORAGE_KEY
} from '../context/TransactionRefreshContext';

const useTransactionRefresh = (onRefresh) => {
  const { lastRefresh } = useContext(TransactionRefreshContext);
  const lastProcessedRef = useRef(lastRefresh || 0);
  const isRefreshFunction = typeof onRefresh === 'function';

  const triggerRefresh = useCallback((timestamp) => {
    if (!isRefreshFunction) {
      return;
    }

    const normalizedTimestamp =
      typeof timestamp === 'number' && !Number.isNaN(timestamp)
        ? timestamp
        : Date.now();

    if (lastProcessedRef.current === normalizedTimestamp) {
      return;
    }

    lastProcessedRef.current = normalizedTimestamp;
    onRefresh();
  }, [isRefreshFunction, onRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isRefreshFunction) {
      return undefined;
    }

    const handleTransactionEvent = (event) => {
      triggerRefresh(event?.detail);
    };

    const handleStorageEvent = (event) => {
      if (event.key !== TRANSACTION_REFRESH_STORAGE_KEY) {
        return;
      }

      if (!event.newValue) {
        triggerRefresh();
        return;
      }

      const parsed = Number.parseInt(event.newValue, 10);
      triggerRefresh(Number.isNaN(parsed) ? undefined : parsed);
    };

    window.addEventListener(TRANSACTION_REFRESH_EVENT, handleTransactionEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(TRANSACTION_REFRESH_EVENT, handleTransactionEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [isRefreshFunction, triggerRefresh]);

  useEffect(() => {
   if (!isRefreshFunction || !lastRefresh) {
     return;
    }
   triggerRefresh(lastRefresh);
  }, [isRefreshFunction, lastRefresh, triggerRefresh]);
};

export default useTransactionRefresh;