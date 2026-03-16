// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { INTERVIEW_STATE, APPROVAL_STATUS } from '@/lib/constants';

interface Member {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  interviewDay?: string;
  interviewTime?: string;
  interviewMode?: string;
  state?: string;
  approved?: string;
  idValidationStatus?: string;
}

interface CommitteeMembersListProps {
  committee: string;
  season?: string;
}

type SortBy = 'name' | 'interview' | 'status' | 'approval';
type SortOrder = 'asc' | 'desc';

export default function CommitteeMembersList({ committee, season }: CommitteeMembersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Read filter/sort state from URL query params
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'name';
  const sortOrder = (searchParams.get('sortOrder') as SortOrder) || 'asc';
  const selectedDate = searchParams.get('date') || 'all';
  const selectedMode = searchParams.get('mode') || 'all';

  const updateQueryParams = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === 'all' && (key === 'date' || key === 'mode')) {
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
        setMembers(data.members);
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
    fetchMembers();
  }, [committee, fetchMembers]);

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      updateQueryParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateQueryParams({ sortBy: newSortBy, sortOrder: 'asc' });
    }
  };

  // Get unique interview dates from members
  const availableDates = Array.from(
    new Set(members.filter((m) => m.interviewDay).map((m) => m.interviewDay))
  ).sort();

  // Filter members by selected date and mode
  const filteredMembers = members.filter((m) => {
    if (selectedDate !== 'all' && m.interviewDay !== selectedDate) return false;
    if (selectedMode !== 'all') {
      const mode = m.interviewMode || 'Physical';
      if (mode !== selectedMode) return false;
    }
    return true;
  });

  // Helper function to truncate name to first two parts
  const truncateName = (fullName: string) => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length <= 2) {
      return fullName;
    }
    return `${nameParts[0]} ${nameParts[1]}`;
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'interview':
        // Sort by interview day and time
        const aInterview =
          a.interviewDay && a.interviewTime ? `${a.interviewDay} ${a.interviewTime}` : '';
        const bInterview =
          b.interviewDay && b.interviewTime ? `${b.interviewDay} ${b.interviewTime}` : '';

        if (!aInterview && !bInterview) comparison = 0;
        else if (!aInterview)
          comparison = 1; // Put unassigned at the end
        else if (!bInterview) comparison = -1;
        else comparison = aInterview.localeCompare(bInterview);
        break;
      case 'status':
        // Define status priority
        const statusPriority: { [key: string]: number } = {
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
      case 'approval':
        // Define approval priority
        const approvalPriority: { [key: string]: number } = {
          [APPROVAL_STATUS.APPROVED]: 1,
          [APPROVAL_STATUS.PENDING]: 2,
          [APPROVAL_STATUS.REJECTED]: 3,
        };

        const aApproval = a.approved || APPROVAL_STATUS.PENDING;
        const bApproval = b.approved || APPROVAL_STATUS.PENDING;

        comparison = (approvalPriority[aApproval] || 999) - (approvalPriority[bApproval] || 999);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => {
    if (!active) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return order === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Committee Members</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
                  {selectedDate !== 'all' ? ` on ${selectedDate}` : ` in ${committee}`}
                </p>
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="date-filter"
                  className="text-sm text-gray-600 font-medium whitespace-nowrap"
                >
                  Interview Day:
                </label>
                <select
                  id="date-filter"
                  value={selectedDate}
                  onChange={(e) => updateQueryParams({ date: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

              <div className="flex items-center gap-2">
                <label
                  htmlFor="mode-filter"
                  className="text-sm text-gray-600 font-medium whitespace-nowrap"
                >
                  Mode:
                </label>
                <select
                  id="mode-filter"
                  value={selectedMode}
                  onChange={(e) => updateQueryParams({ mode: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All ({members.length})</option>
                  <option value="Physical">
                    🏢 Physical ({members.filter((m) => (m.interviewMode || 'Physical') === 'Physical').length})
                  </option>
                  <option value="Online">
                    💻 Online ({members.filter((m) => m.interviewMode === 'Online').length})
                  </option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => handleSort('name')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'name'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Name
                    <SortIcon active={sortBy === 'name'} order={sortOrder} />
                  </button>
                  <button
                    onClick={() => handleSort('interview')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'interview'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Interview
                    <SortIcon active={sortBy === 'interview'} order={sortOrder} />
                  </button>
                  <button
                    onClick={() => handleSort('status')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'status'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Status
                    <SortIcon active={sortBy === 'status'} order={sortOrder} />
                  </button>
                  <button
                    onClick={() => handleSort('approval')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === 'approval'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Approval
                    <SortIcon active={sortBy === 'approval'} order={sortOrder} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {selectedDate === 'all'
              ? 'No members found in this committee'
              : `No members scheduled for ${selectedDate}`}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-200">
              {sortedMembers.map((member, index) => (
                <div
                  key={member.id || `member-${index}-${member.email}`}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900" title={member.fullName}>
                        {truncateName(member.fullName)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">ID: {member.id || 'N/A'}</div>
                    </div>
                    <Link
                      href={`/interviews/${season}/member/${member.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email:</span> {member.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {member.phoneNumber}
                    </div>
                    <div>
                      <span className="font-medium">Interview:</span>{' '}
                      {member.interviewDay && member.interviewTime
                        ? `${member.interviewDay} ${member.interviewTime}`
                        : 'Not assigned'}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW
                            ? 'bg-green-100 text-green-800'
                            : member.state === INTERVIEW_STATE.IN_INTERVIEW
                              ? 'bg-blue-100 text-blue-800'
                              : member.state === INTERVIEW_STATE.WAIT_IN_RECEPTION
                                ? 'bg-yellow-100 text-yellow-800'
                                : member.state === INTERVIEW_STATE.NOT_ATTENDED
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.state || INTERVIEW_STATE.NOT_STARTED}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.approved === APPROVAL_STATUS.APPROVED
                            ? 'bg-green-100 text-green-800'
                            : member.approved === APPROVAL_STATUS.REJECTED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {member.approved === APPROVAL_STATUS.APPROVED
                          ? '✓ Approved'
                          : member.approved === APPROVAL_STATUS.REJECTED
                            ? '✗ Rejected'
                            : '⏳ Pending'}
                      </span>
                      {season === 'S2' && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.idValidationStatus === 'Matched'
                              ? 'bg-emerald-100 text-emerald-800'
                              : member.idValidationStatus === 'Wrong ID'
                                ? 'bg-rose-100 text-rose-800'
                                : member.idValidationStatus === 'Need Review'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {member.idValidationStatus || 'New'}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.interviewMode === 'Online'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {member.interviewMode === 'Online' ? '💻 Online' : '🏢 Physical'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interview
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval
                    </th>
                    {season === 'S2' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Validation
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedMembers.map((member, index) => (
                    <tr
                      key={member.id || `member-${index}-${member.email}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.id || 'N/A'}
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                        title={member.fullName}
                      >
                        {truncateName(member.fullName)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {member.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.phoneNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.interviewDay && member.interviewTime
                          ? `${member.interviewDay} ${member.interviewTime}`
                          : 'Not assigned'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            member.state === INTERVIEW_STATE.COMPLETE_INTERVIEW
                              ? 'bg-green-100 text-green-800'
                              : member.state === INTERVIEW_STATE.IN_INTERVIEW
                                ? 'bg-blue-100 text-blue-800'
                                : member.state === INTERVIEW_STATE.WAIT_IN_RECEPTION
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : member.state === INTERVIEW_STATE.NOT_ATTENDED
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.state || INTERVIEW_STATE.NOT_STARTED}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.approved === APPROVAL_STATUS.APPROVED
                              ? 'bg-green-100 text-green-800'
                              : member.approved === APPROVAL_STATUS.REJECTED
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.idValidationStatus === 'Matched'
                                ? 'bg-emerald-100 text-emerald-800'
                                : member.idValidationStatus === 'Wrong ID'
                                  ? 'bg-rose-100 text-rose-800'
                                  : member.idValidationStatus === 'Need Review'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {member.idValidationStatus || 'New'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.interviewMode === 'Online'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {member.interviewMode === 'Online' ? '💻 Online' : '🏢 Physical'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/interviews/${season}/member/${member.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
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
    </div>
  );
}
