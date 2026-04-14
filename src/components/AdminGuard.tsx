import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage on mount
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'AnitaCantik') {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      // Don't clear password here so user can correct it
    }
  };

  if (loading) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0f18]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-10 text-center space-y-8 border-t-4 border-brand-primary"
      >
        <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto text-brand-primary">
          <Lock className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-white">Admin Access</h2>
          <p className="text-slate-500 font-medium mt-2">Silahkan masukkan password untuk masuk</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Password</label>
            <div className="relative">
              <input 
                autoFocus
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-bold text-center ${showPassword ? '' : 'tracking-[0.5em]'}`}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-rose-500 text-xs font-bold justify-center"
              >
                <AlertCircle className="w-4 h-4" /> Password salah!
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-brand-primary/20 transition-all active:scale-95"
          >
            Masuk Sekarang <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest pt-4">
          Restricted Area • Management System
        </p>
      </motion.div>
    </div>
  );
};

export default AdminGuard;
