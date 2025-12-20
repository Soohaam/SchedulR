'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../lib/store';
import AuthInitializer from '../components/auth/AuthInitializer';
import { setApiStoreDispatch } from '../lib/api';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>(undefined);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
    // Set the dispatch reference for API interceptors
    setApiStoreDispatch(storeRef.current.dispatch);
  }

  return (
    <Provider store={storeRef.current}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </Provider>
  );
}
