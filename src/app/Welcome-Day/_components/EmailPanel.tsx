// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

interface EmailFormProps {
  onSuccess?: () => void;
  season?: string;
}

export default function EmailPanel({ onSuccess, season }: EmailFormProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [attendeeId, setAttendeeId] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'test' | 'unsent' | 'single' | null>(null);
  const [emailResults, setEmailResults] = useState<
    Array<{
      success: boolean;
      name?: string;
      email: string;
      committee?: string;
      attendeeId?: string;
      error?: string;
    }>
  >([]);

  const openConfirmDialog = (action: 'test' | 'unsent' | 'single') => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleConfirm = async () => {
    closeConfirmDialog();
    if (confirmAction === 'test') {
      await handleSendTestEmails();
    } else if (confirmAction === 'unsent') {
      await handleSendUnsentEmails();
    } else if (confirmAction === 'single') {
      await handleSendSingleEmail();
    }
  };

  const handleSendTestEmails = async () => {
    setLoading(true);
    setMessage('');
    setEmailResults([]);

    try {
      const res = await fetch(
        `/api/Welcome-Day/email/send-test${season ? `?season=${season}` : ''}`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(`${data.message}`);
        setEmailResults(data.results || []);
        showToast(data.message, 'success');
      } else {
        setMessage(`${data.error}`);
        showToast(data.error, 'error');
      }
    } catch {
      const errorMsg = 'Failed to send test emails';
      setMessage(`${errorMsg}`);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendUnsentEmails = async () => {
    setLoading(true);
    setMessage('');
    setEmailResults([]);

    try {
      const res = await fetch(
        `/api/Welcome-Day/email/send-unsent${season ? `?season=${season}` : ''}`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(`${data.message}`);
        setEmailResults(data.results || []);
        showToast(data.message, 'success');
        onSuccess?.();
      } else {
        setMessage(`${data.error}`);
        showToast(data.error, 'error');
      }
    } catch {
      const errorMsg = 'Failed to send unsent emails';
      setMessage(`${errorMsg}`);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSingleEmail = async () => {
    if (!attendeeId.trim()) {
      showToast('Please enter an attendee ID', 'error');
      return;
    }

    setLoading(true);
    setMessage('');
    setEmailResults([]);

    try {
      const res = await fetch(
        `/api/Welcome-Day/email/send/${attendeeId.trim()}${season ? `?season=${season}` : ''}`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(`Email sent successfully to attendee ID: ${attendeeId}`);
        showToast(data.message, 'success');
        setAttendeeId('');
        onSuccess?.();
      } else {
        setMessage(`${data.error}`);
        showToast(data.error, 'error');
      }
    } catch {
      const errorMsg = 'Failed to send email';
      setMessage(`${errorMsg}`);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Email Management</h2>
          <p className="text-sm text-gray-600">Send Welcome Day confirmation emails to attendees</p>
        </div>

        {/* Send to Specific ID */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-indigo-900">Send to Specific Attendee</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter Attendee ID (e.g., 15689)"
              value={attendeeId}
              onChange={(e) => setAttendeeId(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => openConfirmDialog('single')}
              disabled={loading || !attendeeId.trim()}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
            >
              {loading ? <span className="animate-spin">⏳</span> : <span>Send</span>}
            </button>
          </div>
          <p className="text-xs text-indigo-700 mt-2">
            Send Welcome Day confirmation email to a specific attendee by their ID
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => openConfirmDialog('test')}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold">Send Test Emails</div>
                <div className="text-xs text-purple-200 mt-0.5">
                  Sends one test email per committee to your test email address
                </div>
              </div>
            </div>
            {loading ? (
              <span className="animate-spin text-xl">⏳</span>
            ) : (
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>

          <button
            onClick={() => openConfirmDialog('unsent')}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold">Send All Unsent Emails</div>
                <div className="text-xs text-orange-200 mt-0.5">
                  Sends Welcome Day confirmations to attendees who haven&apos;t received emails
                </div>
              </div>
            </div>
            {loading ? (
              <span className="animate-spin text-xl">⏳</span>
            ) : (
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.startsWith('✅')
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="font-medium">{message.replace('✅', '').replace('❌', '').trim()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {emailResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Email Sending Results</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {emailResults.filter((r) => r.success).length} successful,{' '}
                  {emailResults.filter((r) => !r.success).length} failed
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  ✓ {emailResults.filter((r) => r.success).length}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                  ✗ {emailResults.filter((r) => !r.success).length}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Committee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {emailResults.map((result, index) => (
                      <tr
                        key={index}
                        className={
                          result.success ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'
                        }
                      >
                        <td className="px-4 py-3 text-sm">
                          {result.success ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                              ✗
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {result.name || result.committee || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {result.committee || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">{result.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {emailResults.map((result, index) => (
                  <div key={index} className={`p-4 ${result.success ? 'bg-white' : 'bg-red-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                        {result.success ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-lg">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 text-lg">
                            ✗
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {result.name || result.committee || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{result.email}</p>
                        {result.committee && (
                          <p className="text-xs text-gray-500 mt-1">
                            Committee: {result.committee}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Email Tips:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Test emails are sent to your configured test email address</li>
                <li>• Emails are only sent once per attendee (tracked by isEmailSend flag)</li>
                <li>• Failed emails can be retried by running the send operation again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirm Email Send</h3>
            </div>

            <p className="text-gray-700 mb-6">
              {confirmAction === 'test' && (
                <>
                  Are you sure you want to send <strong>test emails</strong> to your configured test
                  email address?
                </>
              )}
              {confirmAction === 'unsent' && (
                <>
                  Are you sure you want to send Welcome Day confirmation emails to{' '}
                  <strong>all attendees</strong> who haven&apos;t received emails yet?
                </>
              )}
              {confirmAction === 'single' && (
                <>
                  Are you sure you want to send a Welcome Day confirmation email to attendee with
                  ID: <strong className="text-indigo-600">{attendeeId}</strong>?
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
                  confirmAction === 'test'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : confirmAction === 'unsent'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
