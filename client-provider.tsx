'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
  firebaseConfig: any;
}) {
  // تهيئة Firebase مع الحفاظ على استمرارية العرض حتى لو فشلت التهيئة
  const firebase = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
}
