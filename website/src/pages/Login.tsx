import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Banknote, Github, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@steadypocket.com' && password === 'admin') {
      localStorage.setItem('is_admin', 'true');
      window.location.href = '/';
    } else {
      setError('Invalid admin credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20">
            <Banknote className="text-black w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Steady Pocket</h1>
          <p className="text-neutral-500 uppercase tracking-[0.2em] text-xs font-semibold">Admin Monitoring Platform</p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="admin@steadypocket.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-neutral-600 text-sm">
          Internal access only. Unauthorized access is monitored.
        </p>
      </motion.div>
    </div>
  );
}
