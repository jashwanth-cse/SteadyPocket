import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Banknote, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowNotice(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />

      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111111] border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Hackathon Demo
                  </h3>
                  <p className="text-emerald-500/60 text-xs font-mono uppercase tracking-wider">
                    Access Credentials
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
                    Email ID
                  </p>
                  <p className="text-white font-mono text-sm selection:bg-emerald-500/30">
                    admin@steadypocket.com
                  </p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
                    Password
                  </p>
                  <p className="text-white font-mono text-sm selection:bg-emerald-500/30">
                    Admin@321
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotice(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Got It, Let's Go
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/20"
          >
            <Banknote className="text-black w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Steady Pocket
          </h1>
          <p className="text-neutral-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            Admin Monitoring Platform
          </p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl relative group">
          <div className="absolute inset-0 bg-emerald-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <form onSubmit={handleEmailLogin} className="space-y-6 relative">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-neutral-700"
                placeholder="admin@steadypocket.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-neutral-700"
                placeholder="Admin@321"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-xs bg-red-400/10 p-4 rounded-2xl border border-red-400/20 font-medium"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-[0.98] mt-4"
            >
              Sign In to Platform
            </button>
          </form>
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-neutral-600 text-[10px] uppercase tracking-widest font-bold">
            Internal Access Only • Authorized Personnel
          </p>
          <p className="text-neutral-700 text-[9px] uppercase tracking-widest">
            Hackathon Build 1.0.4 • 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
