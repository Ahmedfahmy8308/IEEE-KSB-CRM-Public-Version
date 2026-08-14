// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Calendar,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ArrowLeft,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  username: string;
  name: string;
  role: string;
  position: string;
  committee?: string;
  accessSeason?: string;
}

type Season = 'S1' | 'S2';

const SEASON_LABELS: Record<Season, string> = {
  S1: 'Season 1',
  S2: 'Season 2',
};

function parseAccessSeason(accessSeason: string | undefined): Season[] {
  if (!accessSeason || accessSeason.toLowerCase() === 'all') {
    return ['S1', 'S2'];
  }
  const parts = accessSeason.split(',').map((s) => s.trim().toUpperCase());
  const valid = parts.filter((s) => s === 'S1' || s === 'S2') as Season[];
  return valid.length > 0 ? valid : ['S1', 'S2'];
}

const ROLE_BADGES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ChairMan: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  highboard: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700',
    border: 'border-blue-500/20',
    dot: 'bg-blue-600',
  },
  board: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user);
            const seasons = parseAccessSeason(data.user.accessSeason);
            if (seasons.length === 1) {
              setSelectedSeason(seasons[0]);
            }
          }
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  const allowedSeasons = parseAccessSeason(user.accessSeason);
  const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.board;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-sky-400/10 via-blue-600/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 via-blue-400/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-32 sm:w-36 h-10 sm:h-12">
                <Image
                  src="/Logo/Logo.png"
                  alt="IEEE KSB Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00629B] to-[#004879] flex items-center justify-center text-white shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`} />
                      {user.role}
                    </span>
                    {user.committee && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {user.committee}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] min-w-[44px] justify-center bg-rose-50 hover:bg-rose-100/80 text-rose-600 rounded-xl transition-all duration-200 font-semibold text-xs sm:text-sm border border-rose-200/60 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200/70 rounded-full text-[#00629B] text-xs sm:text-sm font-semibold mb-5 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>IEEE Kafr El-Sheikh Student Branch</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
            Welcome Back,{' '}
            <span className="bg-gradient-to-r from-[#00629B] via-[#004879] to-[#0284c7] bg-clip-text text-transparent">
              {user.name?.split(' ')[0]}
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            {selectedSeason
              ? `Working in ${SEASON_LABELS[selectedSeason]} — Select the module you wish to manage.`
              : 'Choose the active season to access Interview and Welcome Day operations.'}
          </p>
        </motion.div>

        {/* Step 1: Season Selection */}
        <AnimatePresence mode="wait">
          {!selectedSeason ? (
            <motion.div
              key="season-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
                {allowedSeasons.map((season, idx) => (
                  <motion.button
                    key={season}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSeason(season)}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-left cursor-pointer flex flex-col justify-between"
                  >
                    {/* Glowing Accent */}
                    <div
                      className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
                        season === 'S1'
                          ? 'bg-blue-500/10 group-hover:opacity-100'
                          : 'bg-indigo-500/10 group-hover:opacity-100'
                      }`}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md transition-transform duration-300 group-hover:scale-105 ${
                            season === 'S1'
                              ? 'bg-gradient-to-br from-[#00629B] to-[#0284c7] shadow-blue-500/20'
                              : 'bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] shadow-indigo-500/20'
                          }`}
                        >
                          {season}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          Season {idx + 1}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                        {SEASON_LABELS[season]}
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                        Access applicant review, interview evaluation pipelines, and Welcome Day
                        registrations for {SEASON_LABELS[season]}.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 font-semibold text-xs sm:text-sm text-[#00629B] group-hover:text-blue-700">
                      <span>Enter Workspace</span>
                      <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Step 2: Module Selection */
            <motion.div
              key="module-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {/* Back to Season Navigation */}
              {allowedSeasons.length > 1 && (
                <div className="mb-6 flex justify-center sm:justify-start">
                  <button
                    onClick={() => setSelectedSeason(null)}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#00629B] bg-white border border-slate-200/80 px-4 py-2 min-h-[44px] rounded-xl hover:shadow-xs transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Change Season ({SEASON_LABELS[selectedSeason]})</span>
                  </button>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                {/* Module 1: Interview Dashboard */}
                <Link
                  href={`/interviews/${selectedSeason}`}
                  className="group block focus:outline-none"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00629B] to-[#0284c7] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 text-[#00629B] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                          {SEASON_LABELS[selectedSeason]}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                        Interview Hub
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                        Complete candidate lifecycle: applicant screening, scheduling, committee
                        evaluations, and notification dispatch.
                      </p>

                      <div className="space-y-2 mb-6">
                        {[
                          'Candidate Search & Filtering',
                          'Automated Schedule Engine',
                          'Committee Statistics & Acceptance',
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 text-xs sm:text-sm text-slate-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#00629B] group-hover:text-blue-700">
                      <span>Launch Interview Hub</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </motion.div>
                </Link>

                {/* Module 2: Welcome Day */}
                <Link
                  href={`/Welcome-Day/${selectedSeason}`}
                  className="group block focus:outline-none"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-13 h-13 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/60">
                          {SEASON_LABELS[selectedSeason]}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                        Welcome Day
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                        Event attendee management: payment validation, live QR code check-in
                        scanner, and instant attendance analytics.
                      </p>

                      <div className="space-y-2 mb-6">
                        {[
                          'Attendee & Payment Verification',
                          'Fast QR Check-in System',
                          'Automated Confirmation Emails',
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 text-xs sm:text-sm text-slate-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-purple-600 group-hover:text-purple-700">
                      <span>Launch Welcome Day</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chairman Badge Info */}
        {user.role === 'ChairMan' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto mt-10"
          >
            <div className="flex items-center gap-3 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs sm:text-sm shadow-xs">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p>
                <strong>Chairman Mode Active:</strong> Full administrative privileges are enabled,
                including system configuration, scheduler override, email batches, and origin data
                pulling.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
