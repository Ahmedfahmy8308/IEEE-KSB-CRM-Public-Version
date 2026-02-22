// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Footer from '@/components/Footer';
import Sidebar from '@/app/interviews/_components/Sidebar';
import { INTERVIEW_STATE } from '@/lib/constants';

interface User {
  username: string;
  name: string;
  role: string;
  position: string;
  committee?: string;
}

interface Member {
  id: string;
  fullName: string;
  trackApplying: string;
  state: string;
  interviewTime?: string;
  phoneNumber?: string;
  email?: string;
}

export default function ActiveInterviewsPage() {
  const router = useRouter();
  const params = useParams();
  const season = params.season as string;
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchActiveMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/members/active?season=${season}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      } else {
        setError('Failed to fetch active members');
      }
    } catch (err) {
      setError('An error occurred while fetching members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    if (user) {
      fetchActiveMembers();
      // Refresh every 30 seconds
      const interval = setInterval(fetchActiveMembers, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchActiveMembers]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleTabChange = (
    tab: 'dashboard' | 'search' | 'schedule' | 'email' | 'validation' | 'approved-email' | 'pull'
  ) => {
    if (tab === 'dashboard') {
      router.push(`/interviews/${season}`);
    } else {
      router.push(`/interviews/${season}?tab=${tab}`);
    }
  };

  if (loading && !user) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  const inInterviewMembers = members.filter((m) => m.state === INTERVIEW_STATE.IN_INTERVIEW);
  const waitingMembers = members.filter((m) => m.state === INTERVIEW_STATE.WAIT_IN_RECEPTION);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeTab="active-interviews"
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
                  Active Interviews
                  <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {season === 'S1' ? 'Season 1' : 'Season 2'}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {user.role === 'board' && user.committee
                    ? `Showing members for ${user.committee} committee`
                    : 'Real-time view of members currently in the interview process'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Refresh Button */}
                <button
                  onClick={fetchActiveMembers}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* User Info */}
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
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-4 lg:px-8 py-6 pt-24 overflow-y-auto w-full max-w-full">
          {/* Auto-refresh indicator */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">This page auto-refreshes every 30 seconds</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading && members.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && members.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12">
              <div className="text-center">
                <svg
                  className="w-20 h-20 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Interviews</h3>
                <p className="text-gray-500">
                  There are currently no members waiting in reception or in interview
                </p>
              </div>
            </div>
          )}

          {members.length > 0 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Active</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{members.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">In Interview</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">
                        {inInterviewMembers.length}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Waiting</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">
                        {waitingMembers.length}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* In Interview Section */}
              {inInterviewMembers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Currently In Interview ({inInterviewMembers.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {inInterviewMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        status="in-interview"
                        onClick={() => router.push(`/interviews/${season}/member/${member.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Waiting in Reception Section */}
              {waitingMembers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Waiting in Reception ({waitingMembers.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {waitingMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        status="waiting"
                        onClick={() => router.push(`/interviews/${season}/member/${member.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

function MemberCard({
  member,
  status,
  onClick,
}: {
  member: Member;
  status: 'in-interview' | 'waiting';
  onClick: () => void;
}) {
  const bgColor =
    status === 'in-interview' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200';
  const badgeColor =
    status === 'in-interview' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 ${bgColor} transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h4 className="text-lg font-semibold text-gray-900">{member.fullName}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {member.trackApplying}
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
              <span className="font-mono">{member.id}</span>
            </div>
            {member.interviewTime && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{member.interviewTime}</span>
              </div>
            )}
            {member.phoneNumber && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="break-all">{member.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>
        {/* Arrow indicator */}
        <div className="ml-3 flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
