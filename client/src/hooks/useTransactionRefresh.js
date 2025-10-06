import { useEffect } from 'react';

const EVENT_NAME = 'transactionAdded';

const useTransactionRefresh = (onRefresh) => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof onRefresh !== 'function') {
      return undefined;
    }

    const handler = () => {
      onRefresh();
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, [onRefresh]);
};

export default useTransactionRefresh;