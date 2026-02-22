// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/constants';

interface Attendee {
  rowIndex?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  attended?: string;
  committee?: string;
  checked?: string;
  paymentMethod?: string;
  qrCode?: string;
}

interface CommitteeMembersListProps {
  committee: string;
  season?: string;
}

type SortBy = 'name' | 'attendance';
type SortOrder = 'asc' | 'desc';
type PaymentFilter = 'all' | PaymentMethod;

export default function CommitteeMembersList({ committee, season }: CommitteeMembersListProps) {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/Welcome-Day/committee/members?committee=${encodeURIComponent(committee)}${season ? `&season=${season}` : ''}`
      );
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.members || []);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }, [committee, season, router]);

  useEffect(() => {
    fetchAttendees();
  }, [committee, fetchAttendees]);

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const truncateName = (fullName: string) => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length <= 2) {
      return fullName;
    }
    return `${nameParts[0]} ${nameParts[1]}`;
  };

  const sortedAttendees = [...attendees].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'attendance':
        const aAttended = a.attended?.toLowerCase() === 'true' ? 1 : 0;
        const bAttended = b.attended?.toLowerCase() === 'true' ? 1 : 0;
        comparison = bAttended - aAttended;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Apply payment filter
  const filteredAttendees =
    paymentFilter === 'all'
      ? sortedAttendees
      : sortedAttendees.filter((a) => a.paymentMethod === paymentFilter);

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
                <h2 className="text-xl font-bold text-gray-800">Committee Attendees</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} in {committee}
                </p>
              </div>
            </div>

            {/* Sort Controls */}
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
                  onClick={() => handleSort('attendance')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'attendance'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Attendance
                  <SortIcon active={sortBy === 'attendance'} order={sortOrder} />
                </button>
              </div>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Payment Method:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'all'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPaymentFilter(PAYMENT_METHODS.INSTAPAY)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === PAYMENT_METHODS.INSTAPAY
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Instapay
                </button>
                <button
                  onClick={() => setPaymentFilter(PAYMENT_METHODS.VODAFONE_CASH)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === PAYMENT_METHODS.VODAFONE_CASH
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vodafone Cash
                </button>
              </div>
            </div>
          </div>
        </div>

        {attendees.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No attendees found in this committee</div>
        ) : filteredAttendees.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No attendees found with selected payment method
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-200">
              {filteredAttendees.map((attendee, index) => (
                <div
                  key={attendee.rowIndex || `attendee-${index}-${attendee.email}`}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900" title={attendee.fullName}>
                        {truncateName(attendee.fullName)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {attendee.rowIndex || 'N/A'}
                      </div>
                    </div>
                    <a
                      href={`/Welcome-Day/${season}/member/${attendee.rowIndex}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email:</span> {attendee.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {attendee.phoneNumber}
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span>{' '}
                      {attendee.paymentMethod || 'N/A'}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          attendee.attended?.toLowerCase() === 'true'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {attendee.attended?.toLowerCase() === 'true'
                          ? '✓ Attended'
                          : 'Not Attended'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          attendee.checked === 'Passed'
                            ? 'bg-blue-100 text-blue-800'
                            : attendee.checked === 'Failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {attendee.checked || 'Not Checked'}
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
                      Payment Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checked
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendees.map((attendee, index) => (
                    <tr
                      key={attendee.rowIndex || `attendee-${index}-${attendee.email}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {attendee.rowIndex || 'N/A'}
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                        title={attendee.fullName}
                      >
                        {truncateName(attendee.fullName)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {attendee.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {attendee.phoneNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            attendee.paymentMethod === 'Instapay'
                              ? 'bg-indigo-100 text-indigo-800'
                              : attendee.paymentMethod === 'Vodafone Cash'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {attendee.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            attendee.checked === 'Passed'
                              ? 'bg-blue-100 text-blue-800'
                              : attendee.checked === 'Failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {attendee.checked || 'Not Checked'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            attendee.attended?.toLowerCase() === 'true'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {attendee.attended?.toLowerCase() === 'true'
                            ? '✓ Attended'
                            : 'Not Attended'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`/Welcome-Day/${season}/member/${attendee.rowIndex}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </a>
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
