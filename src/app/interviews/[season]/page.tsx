// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Footer from '@/components/Footer';
import Sidebar from '@/app/interviews/_components/Sidebar';
import StatsCards from '@/app/interviews/_components/StatsCards';
import CommitteeBreakdown from '@/app/interviews/_components/CommitteeBreakdown';
import SearchPanel from '@/app/interviews/_components/SearchPanel';
import CommitteeStats from '@/app/interviews/_components/CommitteeStats';
import CommitteeMembersList from '@/app/interviews/_components/CommitteeMembersList';
import SchedulePanel from '@/app/interviews/_components/SchedulePanel';
import EmailPanel from '@/app/interviews/_components/EmailPanel';
import ApprovedEmailPanel from '@/app/interviews/_components/ApprovedEmailPanel';
import ValidationPanel from '@/app/interviews/_components/ValidationPanel';
import PullPanel from '@/app/interviews/_components/PullPanel';

interface User {
  username: string;
  name: string;
  role: string;
  position: string;
  committee?: string;
  accessSeason?: string;
}

interface Stats {
  total: number;
  assigned: number;
  emailSent: number;
  approved: number;
  rejected: number;
  pending: number;
  completed: number;
  notStarted: number;
  notAttended: number;
  byCommittee: Record<string, number>;
  idMatched?: number;
  idNew?: number;
  idMismatch?: number;
  idNeedReview?: number;
  physical?: number;
  online?: number;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const season = params.season as string;
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);

  // Helper to append season to API URLs
  const apiUrl = useCallback(
    (path: string, extraParams?: Record<string, string>) => {
      const p = new URLSearchParams({ season, ...extraParams });
      return `${path}?${p.toString()}`;
    },
    [season]
  );

  // Get active tab from URL, default to 'dashboard'
  const activeTab =
    (searchParams.get('tab') as
      | 'dashboard'
      | 'search'
      | 'schedule'
      | 'email'
      | 'validation'
      | 'approved-email'
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
      const res = await fetch(apiUrl('/api/interviews/members/stats'));
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error);
    }
  }, [apiUrl]);

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
    tab: 'dashboard' | 'search' | 'schedule' | 'email' | 'validation' | 'approved-email' | 'pull'
  ) => {
    // Update URL with new tab
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', tab);
    router.push(`/interviews/${season}?${p.toString()}`);
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
                  Dashboard
                  <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {season === 'S1' ? 'Season 1' : 'Season 2'}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Overview of interview system statistics
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
                        router.push(`/interviews/${season}?${p.toString()}`);
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
                  {stats && <StatsCards stats={stats} season={season} />}

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

          {/* Schedule Tab - Chairman Only */}
          {activeTab === 'schedule' && user.role === 'ChairMan' && (
            <SchedulePanel onSuccess={handleSuccess} season={season} />
          )}

          {/* Email Tab - Chairman Only */}
          {activeTab === 'email' && user.role === 'ChairMan' && (
            <EmailPanel onSuccess={handleSuccess} season={season} />
          )}

          {/* Approved Email Tab - Chairman Only */}
          {activeTab === 'approved-email' && user.role === 'ChairMan' && (
            <ApprovedEmailPanel onSuccess={handleSuccess} season={season} />
          )}

          {/* Validation Tab - Chairman Only */}
          {activeTab === 'validation' && user.role === 'ChairMan' && (
            <ValidationPanel season={season} />
          )}

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

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}
