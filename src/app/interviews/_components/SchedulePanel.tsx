// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';

interface SchedulePanelProps {
  onSuccess?: () => void;
  season?: string;
  readOnly?: boolean;
}

export default function SchedulePanel({ onSuccess, season, readOnly }: SchedulePanelProps) {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('17:00');
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [parallelSeats, setParallelSeats] = useState(2);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'assign' | 'generateIds' | null>(null);
  const [byDay, setByDay] = useState<Record<string, { total: number; physical: number; online: number }> | null>(null);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalAssigned, setTotalAssigned] = useState(0);

  const fetchByDayStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/interviews/members/stats${season ? `?season=${season}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats?.byDay) {
          setByDay(data.stats.byDay);
        }
        setPhysicalCount(data.stats?.physical ?? 0);
        setOnlineCount(data.stats?.online ?? 0);
        setTotalAssigned(data.stats?.assigned ?? 0);
      }
    } catch {
      // silently fail
    }
  }, [season]);

  useEffect(() => {
    fetchByDayStats();
  }, [fetchByDayStats]);

  const openConfirmDialog = (action: 'assign' | 'generateIds') => {
    // For assign action, check if dates are filled
    if (action === 'assign' && (!startDate || !endDate)) {
      showToast('Please fill in start and end dates', 'error');
      return;
    }
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleConfirm = async () => {
    closeConfirmDialog();
    if (confirmAction === 'assign') {
      await handleAssignSchedule();
    } else if (confirmAction === 'generateIds') {
      await handleScheduleUnscheduled();
    }
  };

  const handleAssignSchedule = async () => {
    setScheduleLoading(true);
    setScheduleMessage('');

    try {
      const res = await fetch(
        `/api/interviews/schedule/assign${season ? `?season=${season}` : ''}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate,
            endDate,
            startTime,
            endTime,
            intervalMinutes,
            parallelSeats,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setScheduleMessage(' ' + data.message);
        showToast(data.message, 'success');
        await fetchByDayStats();
        onSuccess?.();
      } else {
        setScheduleMessage(' ' + data.error);
        showToast(data.error, 'error');
      }
    } catch {
      const errorMsg = 'Failed to assign schedule';
      setScheduleMessage(' ' + errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleScheduleUnscheduled = async () => {
    setScheduleLoading(true);
    setScheduleMessage('');
    try {
      const res = await fetch(`/api/interviews/schedule/Id${season ? `?season=${season}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleMessage(data.message);
        showToast(data.message, 'success');
        await fetchByDayStats();
        onSuccess?.();
      } else {
        setScheduleMessage(data.error);
        showToast(data.error, 'error');
      }
    } catch {
      const errorMsg = 'Failed to generate IDs';
      setScheduleMessage(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full">
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Schedule Management</h2>
            <p className="text-sm text-gray-600 mb-4">Assign interview schedules to applicants</p>
          </div>

          {/* Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-blue-800 text-sm">Schedule Interviews</h3>
              </div>
              <p className="text-xs text-blue-700">
                Assign interview day & time to members with empty schedule
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-green-800 text-sm">Generate IDs Only</h3>
              </div>
              <p className="text-xs text-green-700">
                Create unique IDs for members without IDs (no scheduling)
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              openConfirmDialog('assign');
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="intervalMinutes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Interview Interval (minutes)
                </label>
                <input
                  type="number"
                  id="intervalMinutes"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                  min="5"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="parallelSeats"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Parallel Seats
                </label>
                <input
                  type="number"
                  id="parallelSeats"
                  value={parallelSeats}
                  onChange={(e) => setParallelSeats(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={scheduleLoading || readOnly}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {readOnly ? '🔒 View Only' : scheduleLoading ? '⏳ Scheduling...' : 'Assign Interview Schedule'}
              </button>
              <button
                type="button"
                onClick={() => openConfirmDialog('generateIds')}
                disabled={scheduleLoading || readOnly}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {readOnly ? '🔒 View Only' : scheduleLoading ? '⏳ Generating IDs...' : 'Generate IDs Only'}
              </button>
            </div>
          </form>
          {scheduleMessage && (
            <div
              className={
                scheduleMessage.startsWith('✅')
                  ? 'bg-green-50 text-green-800 border border-green-200 p-4 rounded-lg'
                  : 'bg-red-50 text-red-800 border border-red-200 p-4 rounded-lg'
              }
            >
              {scheduleMessage}
            </div>
          )}

          {/* Online / Physical Stats */}
          {totalAssigned > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-emerald-600 uppercase mb-1">Physical</p>
                <p className="text-3xl font-bold text-emerald-900">{physicalCount}</p>
                <p className="text-xs text-emerald-600 mt-1">in-person interviews</p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-violet-600 uppercase mb-1">Online</p>
                <p className="text-3xl font-bold text-violet-900">{onlineCount}</p>
                <p className="text-xs text-violet-600 mt-1">Google Meet interviews</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-slate-600 uppercase mb-1">Total Assigned</p>
                <p className="text-3xl font-bold text-slate-900">{totalAssigned}</p>
                <p className="text-xs text-slate-600 mt-1">scheduled interviews</p>
              </div>
            </div>
          )}

          {/* Per-Day Interview Cards */}
          {byDay && Object.keys(byDay).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Interviews Per Day</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Object.entries(byDay)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, counts]) => {
                    const date = new Date(day + 'T00:00:00');
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div
                        key={day}
                        className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-3 text-center hover:shadow-md transition-shadow"
                      >
                        <p className="text-xs font-medium text-indigo-600 uppercase">{dayName}</p>
                        <p className="text-sm font-semibold text-indigo-800 mb-1">{monthDay}</p>
                        <p className="text-2xl font-bold text-indigo-900">{counts.total}</p>
                        <div className="flex justify-center gap-2 mt-1">
                          <span className="text-xs text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">Physical {counts.physical}</span>
                          <span className="text-xs text-violet-700 bg-violet-50 rounded px-1.5 py-0.5">Online {counts.online}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-800">Total Scheduled</span>
                <span className="text-lg font-bold text-indigo-900">
                  {Object.values(byDay).reduce((sum, c) => sum + c.total, 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Schedule Action</h3>
            </div>

            <p className="text-gray-700 mb-6">
              {confirmAction === 'assign' && (
                <>
                  Are you sure you want to <strong>assign interview schedules</strong> to all
                  members with empty schedule fields?
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <p className="font-semibold mb-1">Schedule Details:</p>
                    <ul className="space-y-1">
                      <li>
                        • Dates: {startDate} to {endDate}
                      </li>
                      <li>
                        • Time: {startTime} - {endTime}
                      </li>
                      <li>• Interval: {intervalMinutes} minutes</li>
                      <li>• Parallel Seats: {parallelSeats}</li>
                    </ul>
                  </div>
                </>
              )}
              {confirmAction === 'generateIds' && (
                <>
                  Are you sure you want to <strong>generate unique IDs</strong> for all members
                  without IDs? This action will not affect their interview schedules.
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmDialog}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  confirmAction === 'assign'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Confirm & {confirmAction === 'assign' ? 'Schedule' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
