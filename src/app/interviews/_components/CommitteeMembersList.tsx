// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '@/lib/constants';

interface Member {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  interviewDay?: string;
  interviewTime?: string;
  interviewMode?: string;
  isEmailSend?: boolean;
  isApprovedEmailSend?: boolean;
  state?: string;
  approved?: string;
  idValidationStatus?: string;
}

interface CommitteeMembersListProps {
  committee: string;
  season?: string;
}

type SortBy = 'name' | 'day' | 'time' | 'status' | 'approval' | 'interview';
type SortOrder = 'asc' | 'desc';

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
  }
  return order === 'asc' ? (
    <ArrowUp className="w-3.5 h-3.5 text-[#00629B]" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-[#00629B]" />
  );
}

const truncateName = (fullName: string) => {
  const nameParts = fullName.trim().split(' ');
  if (nameParts.length <= 2) {
    return fullName;
  }
  return `${nameParts[0]} ${nameParts[1]}`;
};

export default function CommitteeMembersList({ committee, season }: CommitteeMembersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state from URL query parameters
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'name';
  const sortOrder = (searchParams.get('sortOrder') as SortOrder) || 'asc';
  const selectedDate = searchParams.get('day') || 'all';
  const selectedMode = searchParams.get('mode') || 'all';

  const updateQueryParams = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === 'all' && (key === 'day' || key === 'mode')) {
        p.delete(key);
      } else {
        p.set(key, value);
      }
    }
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/interviews/committee/members?committee=${encodeURIComponent(committee)}${season ? `&season=${season}` : ''}`
      );
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [committee, season, router]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      if (!isMounted) return;
      await fetchMembers();
    })();
    return () => {
      isMounted = false;
    };
  }, [committee, fetchMembers]);

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      updateQueryParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateQueryParams({ sortBy: newSortBy, sortOrder: 'asc' });
    }
  };

  const availableDates = useMemo(() => {
    return Array.from(
      new Set(members.filter((m) => m.interviewDay).map((m) => m.interviewDay))
    ).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedDate !== 'all' && m.interviewDay !== selectedDate) return false;
      if (selectedMode !== 'all') {
        const mode = m.interviewMode || 'Physical';
        if (mode !== selectedMode) return false;
      }
      return true;
    });
  }, [members, selectedDate, selectedMode]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'interview': {
          const aInterview =
            a.interviewDay && a.interviewTime ? `${a.interviewDay} ${a.interviewTime}` : '';
          const bInterview =
            b.interviewDay && b.interviewTime ? `${b.interviewDay} ${b.interviewTime}` : '';

          if (!aInterview && !bInterview) comparison = 0;
          else if (!aInterview) comparison = 1;
          else if (!bInterview) comparison = -1;
          else comparison = aInterview.localeCompare(bInterview);
          break;
        }
        case 'status': {
          const statusPriority: Record<string, number> = {
            [INTERVIEW_STATE.IN_INTERVIEW]: 1,
            [INTERVIEW_STATE.WAIT_IN_RECEPTION]: 2,
            [INTERVIEW_STATE.COMPLETE_INTERVIEW]: 3,
            [INTERVIEW_STATE.NOT_STARTED]: 4,
            [INTERVIEW_STATE.NOT_ATTENDED]: 5,
          };
          const aStatus = a.state || INTERVIEW_STATE.NOT_STARTED;
          const bStatus = b.state || INTERVIEW_STATE.NOT_STARTED;
          comparison = (statusPriority[aStatus] || 999) - (statusPriority[bStatus] || 999);
          break;
        }
        case 'approval': {
          const approvalPriority: Record<string, number> = {
            [APPROVAL_STATUS.APPROVED]: 1,
            [APPROVAL_STATUS.PENDING]: 2,
            [APPROVAL_STATUS.REJECTED]: 3,
          };
          const aApproval = a.approved || APPROVAL_STATUS.PENDING;
          const bApproval = b.approved || APPROVAL_STATUS.PENDING;
          comparison = (approvalPriority[aApproval] || 999) - (approvalPriority[bApproval] || 999);
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredMembers, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Committee Applicants</h2>
            <p className="text-xs text-slate-500">
              {filteredMembers.length} applicant{filteredMembers.length !== 1 ? 's' : ''}
              {selectedDate !== 'all' ? ` on ${selectedDate}` : ` in ${committee}`}
            </p>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Day filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Day:</span>
            <select
              value={selectedDate}
              onChange={(e) => updateQueryParams({ date: e.target.value })}
              className="px-2.5 py-1.5 min-h-[36px] rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00629B]/20"
            >
              <option value="all">All Days ({members.length})</option>
              {availableDates.map((date) => {
                const count = members.filter((m) => m.interviewDay === date).length;
                return (
                  <option key={date} value={date}>
                    {date} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mode filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => updateQueryParams({ mode: e.target.value })}
              className="px-2.5 py-1.5 min-h-[36px] rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00629B]/20"
            >
              <option value="all">All ({members.length})</option>
              <option value="Physical">
                Physical (
                {members.filter((m) => (m.interviewMode || 'Physical') === 'Physical').length})
              </option>
              <option value="Online">
                Online ({members.filter((m) => m.interviewMode === 'Online').length})
              </option>
            </select>
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            <span className="text-xs font-semibold text-slate-600">Sort:</span>
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-blue-50 text-[#00629B] border border-blue-200/80 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <span>Name</span>
              <SortIcon active={sortBy === 'name'} order={sortOrder} />
            </button>
            <button
              onClick={() => handleSort('interview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'interview'
                  ? 'bg-blue-50 text-[#00629B] border border-blue-200/80 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <span>Interview</span>
              <SortIcon active={sortBy === 'interview'} order={sortOrder} />
            </button>
            <button
              onClick={() => handleSort('status')}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'status'
                  ? 'bg-blue-50 text-[#00629B] border border-blue-200/80 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <span>Status</span>
              <SortIcon active={sortBy === 'status'} order={sortOrder} />
            </button>
            <button
              onClick={() => handleSort('approval')}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'approval'
                  ? 'bg-blue-50 text-[#00629B] border border-blue-200/80 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <span>Approval</span>
              <SortIcon active={sortBy === 'approval'} order={sortOrder} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No applicants found matching the selected filters.
        </div>
      ) : (
        <>
          {/* Mobile Card List (< 1024px) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {sortedMembers.map((member, index) => (
              <div
                key={member.id || `member-${index}-${member.email}`}
                className="p-4 hover:bg-slate-50/70 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm" title={member.fullName}>
                      {truncateName(member.fullName)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {member.id || 'N/A'}</p>
                  </div>
                  <Link
                    href={`/interviews/${season}/member/${member.id}`}
                    className="px-3 py-1.5 min-h-[36px] bg-blue-50 hover:bg-blue-100 text-[#00629B] rounded-xl text-xs font-bold flex items-center gap-1 border border-blue-100 transition-colors"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <div className="truncate">
                    <span className="font-semibold text-slate-500">Email:</span> {member.email}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Phone:</span>{' '}
                    {member.phoneNumber}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Slot:</span>{' '}
                    {member.interviewDay && member.interviewTime
                      ? `${member.interviewDay} @ ${member.interviewTime}`
                      : 'Unassigned'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW
                        ? 'bg-emerald-100 text-emerald-800'
                        : member.state === INTERVIEW_STATE.IN_INTERVIEW
                          ? 'bg-blue-100 text-blue-800'
                          : member.state === INTERVIEW_STATE.WAIT_IN_RECEPTION
                            ? 'bg-amber-100 text-amber-800'
                            : member.state === INTERVIEW_STATE.NOT_ATTENDED
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {member.state || INTERVIEW_STATE.NOT_STARTED}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.approved === APPROVAL_STATUS.APPROVED
                        ? 'bg-emerald-100 text-emerald-800'
                        : member.approved === APPROVAL_STATUS.REJECTED
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.approved === APPROVAL_STATUS.APPROVED
                      ? '✓ Approved'
                      : member.approved === APPROVAL_STATUS.REJECTED
                        ? '✗ Rejected'
                        : '⏳ Pending'}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {member.interviewMode === 'Online' ? '💻 Online' : '🏢 Physical'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 1024px) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Full Name</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Interview Slot</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Approval</th>
                  {season === 'S2' && <th className="px-4 py-3.5">ID Validation</th>}
                  <th className="px-4 py-3.5">Mode</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedMembers.map((member, index) => (
                  <tr
                    key={member.id || `row-${index}-${member.email}`}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900">{member.id || 'N/A'}</td>
                    <td
                      className="px-4 py-3.5 font-semibold text-slate-900"
                      title={member.fullName}
                    >
                      {truncateName(member.fullName)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[180px] truncate">
                      {member.email}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {member.phoneNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {member.interviewDay && member.interviewTime ? (
                        <span className="text-slate-800 font-medium">
                          {member.interviewDay} @ {member.interviewTime}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW
                            ? 'bg-emerald-100 text-emerald-800'
                            : member.state === INTERVIEW_STATE.IN_INTERVIEW
                              ? 'bg-blue-100 text-blue-800'
                              : member.state === INTERVIEW_STATE.WAIT_IN_RECEPTION
                                ? 'bg-amber-100 text-amber-800'
                                : member.state === INTERVIEW_STATE.NOT_ATTENDED
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {member.state || INTERVIEW_STATE.NOT_STARTED}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          member.approved === APPROVAL_STATUS.APPROVED
                            ? 'bg-emerald-100 text-emerald-800'
                            : member.approved === APPROVAL_STATUS.REJECTED
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {member.approved === APPROVAL_STATUS.APPROVED
                          ? '✓ Approved'
                          : member.approved === APPROVAL_STATUS.REJECTED
                            ? '✗ Rejected'
                            : '⏳ Pending'}
                      </span>
                    </td>
                    {season === 'S2' && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            member.idValidationStatus === 'Matched'
                              ? 'bg-emerald-100 text-emerald-800'
                              : member.idValidationStatus === 'Wrong ID'
                                ? 'bg-rose-100 text-rose-800'
                                : member.idValidationStatus === 'Need Review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.idValidationStatus || 'New'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          member.interviewMode === 'Online'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {member.interviewMode === 'Online' ? '💻 Online' : '🏢 Physical'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/interviews/${season}/member/${member.id}`}
                        className="inline-flex items-center gap-1 text-[#00629B] hover:text-[#004879] font-bold hover:underline"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
