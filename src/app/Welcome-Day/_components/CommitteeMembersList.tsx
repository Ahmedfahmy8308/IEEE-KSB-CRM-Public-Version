// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
  }
  return order === 'asc' ? (
    <ArrowUp className="w-3.5 h-3.5 text-purple-700" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-purple-700" />
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
    let isMounted = true;
    void (async () => {
      if (!isMounted) return;
      await fetchAttendees();
    })();
    return () => {
      isMounted = false;
    };
  }, [committee, fetchAttendees]);

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const filteredAttendees = useMemo(() => {
    if (paymentFilter === 'all') return attendees;
    return attendees.filter((a) => a.paymentMethod === paymentFilter);
  }, [attendees, paymentFilter]);

  const sortedAttendees = useMemo(() => {
    return [...filteredAttendees].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'attendance': {
          const aAttended = a.attended?.toLowerCase() === 'true' ? 1 : 0;
          const bAttended = b.attended?.toLowerCase() === 'true' ? 1 : 0;
          comparison = bAttended - aAttended;
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredAttendees, sortBy, sortOrder]);

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
      {/* Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Committee Attendees</h2>
            <p className="text-xs text-slate-500">
              {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} registered for{' '}
              {committee}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Payment filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="px-2.5 py-1.5 min-h-[36px] rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Methods ({attendees.length})</option>
              <option value={PAYMENT_METHODS.INSTAPAY}>Instapay</option>
              <option value={PAYMENT_METHODS.VODAFONE_CASH}>Vodafone Cash</option>
            </select>
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-semibold text-slate-600">Sort:</span>
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <span>Name</span>
              <SortIcon active={sortBy === 'name'} order={sortOrder} />
            </button>
            <button
              onClick={() => handleSort('attendance')}
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'attendance'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <span>Attendance</span>
              <SortIcon active={sortBy === 'attendance'} order={sortOrder} />
            </button>
          </div>
        </div>
      </div>

      {sortedAttendees.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No attendees found matching the criteria.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {sortedAttendees.map((attendee, index) => (
              <div
                key={`attendee-card-${index}-${attendee.email}`}
                className="p-4 hover:bg-slate-50/70 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm" title={attendee.fullName}>
                      {truncateName(attendee.fullName)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{attendee.email}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      attendee.attended?.toLowerCase() === 'true'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {attendee.attended?.toLowerCase() === 'true' ? '✓ Attended' : '✗ Absent'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-500">Phone:</span>{' '}
                    {attendee.phoneNumber}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Payment:</span>{' '}
                    {attendee.paymentMethod || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3.5">#</th>
                  <th className="px-4 py-3.5">Full Name</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Payment Method</th>
                  <th className="px-4 py-3.5">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedAttendees.map((attendee, index) => (
                  <tr
                    key={`attendee-row-${index}-${attendee.email}`}
                    className="hover:bg-purple-50/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-400">{index + 1}</td>
                    <td
                      className="px-4 py-3.5 font-semibold text-slate-900"
                      title={attendee.fullName}
                    >
                      {truncateName(attendee.fullName)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">
                      {attendee.email}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {attendee.phoneNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {attendee.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          attendee.attended?.toLowerCase() === 'true'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {attendee.attended?.toLowerCase() === 'true' ? '✓ Attended' : '✗ Absent'}
                      </span>
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
