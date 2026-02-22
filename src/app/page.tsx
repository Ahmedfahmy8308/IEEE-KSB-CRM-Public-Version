// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
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

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ChairMan: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  highboard: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  board: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [mounted, setMounted] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        const seasons = parseAccessSeason(data.user.accessSeason);
        if (seasons.length === 1) {
          setSelectedSeason(seasons[0]);
        }
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  const allowedSeasons = parseAccessSeason(user.accessSeason);
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.board;

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-50/60 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-50/60 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-50/30 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-32 h-10">
                <Image src="/Logo/Logo.png" alt="IEEE KSB" fill className="object-contain" priority />
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50/80 rounded-xl border border-gray-100">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 leading-tight">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${roleColor.bg} ${roleColor.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot}`} />
                      {user.role}
                    </span>
                    {user.committee && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        {user.committee}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 font-medium text-sm border border-red-100 hover:border-red-200 hover:shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 relative z-10">
        {/* Header */}
        <div
          className={`text-center mb-12 md:mb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            IEEE KSB Management System
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Welcome Back,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {user.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto">
            {selectedSeason
              ? `${SEASON_LABELS[selectedSeason]} — Choose your module`
              : 'Select a season to get started'}
          </p>
        </div>

        {/* Season Selection (Step 1) */}
        {!selectedSeason && (
          <div
            className={`grid md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {allowedSeasons.map((season, i) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-gray-200/80 text-left"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {/* Hover glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${season === 'S1' ? 'from-blue-500/[0.04] to-cyan-500/[0.06]' : 'from-indigo-500/[0.04] to-violet-500/[0.06]'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                {/* Corner accent */}
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 ${season === 'S1' ? 'bg-blue-500/5' : 'bg-indigo-500/5'} rounded-full group-hover:scale-150 transition-transform duration-700`}
                />

                <div className="relative p-8">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${season === 'S1' ? 'from-blue-500 to-cyan-600 shadow-blue-500/30' : 'from-indigo-500 to-violet-600 shadow-indigo-500/30'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
                  >
                    <span className="text-2xl font-black text-white tracking-tight">{season}</span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{SEASON_LABELS[season]}</h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Access Interview Dashboard and Welcome Day for {SEASON_LABELS[season]}
                  </p>

                  <div
                    className={`flex items-center ${season === 'S1' ? 'text-blue-600 group-hover:text-blue-700' : 'text-indigo-600 group-hover:text-indigo-700'} font-semibold text-sm transition-colors`}
                  >
                    <span>Select Season</span>
                    <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Module Selection (Step 2) */}
        {selectedSeason && (
          <div
            className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {/* Back to season selection (only if user has multiple seasons) */}
            {allowedSeasons.length > 1 && (
              <div className="max-w-4xl mx-auto mb-8">
                <button
                  onClick={() => setSelectedSeason(null)}
                  className="group relative inline-flex items-center gap-2.5 text-gray-500 hover:text-blue-600 transition-all duration-300 text-sm font-semibold px-4 py-2 -ml-3 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-100 hover:shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-sm">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
                  </div>
                  <span>Back to Season Selection</span>
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              {/* Interview Dashboard Card */}
              <Link href={`/interviews/${selectedSeason}`} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-gray-200/80 h-full">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Accent stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Corner accent */}
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />

                  <div className="relative p-8">
                    {/* Icon + Badge Row */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-blue-500/25">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {SEASON_LABELS[selectedSeason]}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Interview Dashboard</h2>
                    <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                      Manage interview applicants, schedule interviews, review applications, and
                      track committee members.
                    </p>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                      {[
                        'View & manage applicants',
                        'Schedule interviews',
                        'Committee statistics',
                      ].map((feat) => (
                        <li key={feat} className="flex items-center text-sm text-gray-600">
                          <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center mr-2.5 flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
                      <span>Open Dashboard</span>
                      <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Welcome Day Card */}
              <Link href={`/Welcome-Day/${selectedSeason}`} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-gray-200/80 h-full">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] to-pink-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Accent stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Corner accent */}
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />

                  <div className="relative p-8">
                    {/* Icon + Badge Row */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-purple-500/25">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                        {SEASON_LABELS[selectedSeason]}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Day</h2>
                    <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                      Manage welcome day attendees, track registrations, and monitor event
                      attendance.
                    </p>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                      {['View registrations', 'Track attendance', 'Event statistics'].map(
                        (feat) => (
                          <li key={feat} className="flex items-center text-sm text-gray-600">
                            <div className="w-5 h-5 rounded-md bg-purple-50 flex items-center justify-center mr-2.5 flex-shrink-0">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                            </div>
                            {feat}
                          </li>
                        )
                      )}
                    </ul>

                    {/* CTA */}
                    <div className="flex items-center text-purple-600 font-semibold text-sm group-hover:text-purple-700 transition-colors">
                      <span>Open Welcome Day</span>
                      <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Role info for Chairman */}
        {user.role === 'ChairMan' && (
          <div
            className={`max-w-4xl mx-auto mt-10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-800 text-sm backdrop-blur-sm">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p>
                You have <strong>Chairman</strong> access — all tools including config, scheduling,
                emails, validation, and pull records are available.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
