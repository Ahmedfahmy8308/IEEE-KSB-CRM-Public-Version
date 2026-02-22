// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Footer from '@/components/Footer';
import Sidebar from '@/app/Welcome-Day/_components/Sidebar';
import StatsCards from '@/app/Welcome-Day/_components/StatsCards';
import CommitteeBreakdown from '@/app/Welcome-Day/_components/CommitteeBreakdown';
import SearchPanel from '@/app/Welcome-Day/_components/SearchPanel';
import AllMembersList from '@/app/Welcome-Day/_components/AllMembersList';
import CommitteeStats from '@/app/Welcome-Day/_components/CommitteeStats';
import CommitteeMembersList from '@/app/Welcome-Day/_components/CommitteeMembersList';
import EmailPanel from '@/app/Welcome-Day/_components/EmailPanel';
import ValidationPanel from '@/app/Welcome-Day/_components/ValidationPanel';
import AttendancePanel from '@/app/Welcome-Day/_components/AttendancePanel';
import QRCodePanel from '@/app/Welcome-Day/_components/QRCodePanel';
import PullPanel from '@/app/Welcome-Day/_components/PullPanel';

interface User {
  username: string;
  name: string;
  role: string;
  position: string;
  committee?: string;
}

interface Stats {
  total: number;
  emailSent: number;
  attended: number;
  notAttended: number;
  validationPassed: number;
  validationNotChecked: number;
  validationFailed: number;
  paymentInstapay: number;
  paymentVodafoneCash: number;
  qrCodesGenerated: number;
  byCommittee: Record<string, number>;
}

function WelcomeDayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const season = params.season as string;
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);

  // Get active tab from URL, default to 'dashboard'
  const activeTab =
    (searchParams.get('tab') as
      | 'dashboard'
      | 'search'
      | 'members'
      | 'email'
      | 'validation'
      | 'attendance'
      | 'qrcode'
      | 'pull') || 'dashboard';

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/Welcome-Day/attendees/stats?season=${season}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error);
    }
  }, [season]);

  useEffect(() => {
    checkAuth();
    fetchStats();

    // Check if committee parameter is set
    const committee = searchParams.get('committee');
    if (committee) {
      setSelectedCommittee(committee);
    } else {
      setSelectedCommittee(null);
    }
  }, [searchParams, checkAuth, fetchStats]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSuccess = () => {
    fetchStats();
  };

  const handleTabChange = (
    tab:
      | 'dashboard'
      | 'search'
      | 'members'
      | 'email'
      | 'validation'
      | 'attendance'
      | 'qrcode'
      | 'pull'
  ) => {
    // Update URL with new tab
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', tab);
    router.push(`/Welcome-Day/${season}?${p.toString()}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        season={season}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-64">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm fixed top-0 right-0 left-0 lg:left-64 z-20">
          <div className="px-4 lg:px-8 py-4 pl-16 lg:pl-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome Day Dashboard
                  <span className="ml-2 text-sm font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    {season === 'S1' ? 'Season 1' : 'Season 2'}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Overview of Welcome Day attendees and statistics
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{user.name}</span>
                <span className="text-blue-600 font-medium">({user.position})</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-4 lg:px-8 py-6 pt-24 overflow-y-auto w-full max-w-full">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Board Role - Show Committee View */}
              {user.role === 'board' && user.committee && (
                <>
                  <CommitteeStats committee={user.committee} season={season} />
                  <div className="my-4" />
                  <CommitteeMembersList committee={user.committee} season={season} />
                </>
              )}

              {/* Chairman/Highboard - Committee Drill-down View */}
              {(user.role === 'ChairMan' || user.role === 'highboard') && selectedCommittee && (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setSelectedCommittee(null);
                        const p = new URLSearchParams(searchParams.toString());
                        p.delete('committee');
                        router.push(`/Welcome-Day/${season}?${p.toString()}`);
                      }}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back to Overview
                    </button>
                  </div>
                  <CommitteeStats committee={selectedCommittee} season={season} />
                  <div className="my-4" />
                  <CommitteeMembersList committee={selectedCommittee} season={season} />
                </>
              )}

              {/* Chairman/Highboard - General View */}
              {(user.role === 'ChairMan' || user.role === 'highboard') && !selectedCommittee && (
                <>
                  {/* Stats Cards */}
                  {stats && <StatsCards stats={stats} />}

                  <div className="my-4" />

                  {/* Committee Breakdown */}
                  {stats && (
                    <CommitteeBreakdown
                      byCommittee={stats.byCommittee}
                      userRole={user.role}
                      season={season}
                    />
                  )}

                  <div className="my-4" />
                </>
              )}
            </>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && <SearchPanel season={season} />}

          {/* All Members Tab - Chairman Only */}
          {activeTab === 'members' && user.role === 'ChairMan' && (
            <AllMembersList season={season} />
          )}

          {/* Email Tab - Chairman Only */}
          {activeTab === 'email' && user.role === 'ChairMan' && (
            <EmailPanel onSuccess={handleSuccess} season={season} />
          )}

          {/* Validation Tab - Chairman Only */}
          {activeTab === 'validation' && user.role === 'ChairMan' && (
            <ValidationPanel season={season} />
          )}

          {/* Attendance Tab - Chairman Only */}
          {activeTab === 'attendance' && user.role === 'ChairMan' && (
            <AttendancePanel onSuccess={handleSuccess} season={season} />
          )}

          {/* QR Code Tab - Chairman Only */}
          {activeTab === 'qrcode' && user.role === 'ChairMan' && <QRCodePanel season={season} />}

          {/* Pull Records Tab - Chairman Only */}
          {activeTab === 'pull' && user.role === 'ChairMan' && (
            <PullPanel onSuccess={handleSuccess} season={season} />
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default function WelcomeDayPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WelcomeDayContent />
    </Suspense>
  );
}
