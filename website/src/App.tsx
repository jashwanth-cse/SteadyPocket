import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Riders from './pages/Riders';
import Policies from './pages/Policies';
import Payouts from './pages/Payouts';
import Fraud from './pages/Fraud';
import Login from './pages/Login';
import Logs from './pages/Logs';
import SmartProtectionSystem from './pages/SmartProtectionSystem';
import { useStore } from './store/useStore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initListeners = useStore((state) => state.initListeners);

  useEffect(() => {
    const checkAuth = () => {
      const isLocalAdmin = localStorage.getItem('is_admin') === 'true';
      
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          initListeners();
          setLoading(false);
        } else if (isLocalAdmin) {
          setUser({ email: 'admin@steadypocket.com' } as any);
          initListeners();
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return unsubscribe;
    };

    const unsubscribe = checkAuth();
    return () => unsubscribe();
  }, [initListeners]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-white">
        <div className="animate-pulse text-xl font-mono">INITIALIZING STEADY POCKET...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="riders" element={<Riders />} />
          <Route path="policies" element={<Policies />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="fraud" element={<Fraud />} />
          <Route path="logs" element={<Logs />} />
          <Route path="protection-system" element={<SmartProtectionSystem />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
