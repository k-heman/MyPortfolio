import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';

import type { User } from 'firebase/auth';

export default function ProtectedRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="admin-login" style={{ minHeight: '100vh' }}>
        <div className="admin-login__spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/admin" replace />;
}
