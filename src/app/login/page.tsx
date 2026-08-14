// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok && isMounted) {
          router.push('/');
        }
      } catch {
        // Not authenticated
      } finally {
        if (isMounted) setChecking(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials. Please verify and try again.');
      }
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-[#00629B] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Background Decorative Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-sky-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 via-[#00629B]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Top Brand Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002855] via-[#00629B] to-[#0284c7]" />

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs mb-4">
              <Image
                src="/Logo/Logo2.png"
                alt="IEEE KSB Logo"
                width={70}
                height={70}
                className="object-contain"
                priority
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[#00629B] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>IEEE Kafr El-Sheikh Branch</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Management Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in with your authorized board credentials
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs"
            >
              <div className="w-4 h-4 mt-0.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                !
              </div>
              <p className="font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00629B] rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#00629B]/15 transition-all"
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 min-h-[44px] bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00629B] rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#00629B]/15 transition-all"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 min-h-[46px] bg-gradient-to-r from-[#00629B] to-[#004b77] hover:from-[#0077bc] hover:to-[#00629B] text-white py-3 px-5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg shadow-[#00629B]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Secure Access Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Authorized access only &bull; End-to-end encrypted session</span>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
