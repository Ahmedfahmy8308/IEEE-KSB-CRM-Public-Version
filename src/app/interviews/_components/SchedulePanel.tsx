// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

interface SchedulePanelProps {
  onSuccess?: () => void;
  season?: string;
}

export default function SchedulePanel({ onSuccess, season }: SchedulePanelProps) {
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
                disabled={scheduleLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {scheduleLoading ? '⏳ Scheduling...' : 'Assign Interview Schedule'}
              </button>
              <button
                type="button"
                onClick={() => openConfirmDialog('generateIds')}
                disabled={scheduleLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {scheduleLoading ? '⏳ Generating IDs...' : 'Generate IDs Only'}
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
