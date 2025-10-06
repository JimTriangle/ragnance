import React, { createContext, useCallback, useMemo, useState } from 'react';

export const TRANSACTION_REFRESH_EVENT = 'transactionAdded';
export const TRANSACTION_REFRESH_STORAGE_KEY = 'ragnance:last-transaction-refresh';

export const TransactionRefreshContext = createContext({
  lastRefresh: 0,
  notifyTransactionRefresh: () => {}
});

export const TransactionRefreshProvider = ({ children }) => {
  const [lastRefresh, setLastRefresh] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const storedValue = window.localStorage?.getItem(TRANSACTION_REFRESH_STORAGE_KEY);
      return storedValue ? Number.parseInt(storedValue, 10) || 0 : 0;
    } catch (error) {
      console.warn('Impossible de lire la valeur de rafraîchissement des transactions :', error);
      return 0;
    }
  });

  const notifyTransactionRefresh = useCallback(() => {
    const timestamp = Date.now();
    setLastRefresh(timestamp);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(TRANSACTION_REFRESH_STORAGE_KEY, String(timestamp));
      } catch (error) {
        console.warn('Impossible d\'écrire la valeur de rafraîchissement des transactions :', error);
      }

      window.dispatchEvent(new CustomEvent(TRANSACTION_REFRESH_EVENT, { detail: timestamp }));
    }
  }, []);

  const value = useMemo(
    () => ({ lastRefresh, notifyTransactionRefresh }),
    [lastRefresh, notifyTransactionRefresh]
  );

  return (
    <TransactionRefreshContext.Provider value={value}>
      {children}
    </TransactionRefreshContext.Provider>
  );
};