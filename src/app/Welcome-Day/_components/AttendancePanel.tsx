// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Html5Qrcode } from 'html5-qrcode';

interface AttendancePanelProps {
  onSuccess?: () => void;
  season?: string;
}

export default function AttendancePanel({ onSuccess, season }: AttendancePanelProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [attendeeDetails, setAttendeeDetails] = useState<{
    fullName: string;
    committee: string;
    note: string;
    attended: string;
    checked: string;
    qrCode: string;
  } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startCamera = async () => {
    setCameraActive(true);

    // Wait for the DOM element to be rendered
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader-attendance');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success callback
            setQrCode(decodedText);
            stopCamera();
            // Fetch attendee details for confirmation
            fetchAttendeeDetails(decodedText);
          },
          () => {
            // Error callback (optional, for continuous scanning)
          }
        );
      } catch (error) {
        console.error('Error starting camera:', error);
        showToast('Failed to start camera. Please check permissions.', 'error');
        setCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }
    setCameraActive(false);
  };

  const fetchAttendeeDetails = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/Welcome-Day/attendees/search?q=${encodeURIComponent(code)}${season ? `&season=${season}` : ''}`
      );
      const data = await res.json();

      if (res.ok && data.attendees && data.attendees.length > 0) {
        const attendee = data.attendees[0];

        // Check if already attended
        if (
          attendee.attended?.toLowerCase() === 'yes' ||
          attendee.attended?.toLowerCase() === 'true'
        ) {
          showToast(`${attendee.fullName} has already attended!`, 'error');
          setQrCode('');
          setAttendeeDetails(null);
          setLoading(false);
          return;
        }

        // Set attendee details for confirmation
        setAttendeeDetails({
          fullName: attendee.fullName || 'N/A',
          committee: attendee.committee || 'N/A',
          note: attendee.note || 'No notes',
          attended: attendee.attended || 'No',
          checked: attendee.checked || 'Not Checked',
          qrCode: code,
        });
      } else {
        showToast('Attendee not found with this QR code', 'error');
        setQrCode('');
      }
    } catch {
      showToast('Failed to fetch attendee details', 'error');
      setQrCode('');
    } finally {
      setLoading(false);
    }
  };

  const confirmAttendance = async () => {
    if (!attendeeDetails) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/Welcome-Day/attendance/scan${season ? `?season=${season}` : ''}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: attendeeDetails.qrCode }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast(data.message, 'success');
        setQrCode('');
        setAttendeeDetails(null);
        onSuccess?.();
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Failed to mark attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelConfirmation = () => {
    setAttendeeDetails(null);
    setQrCode('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode.trim()) {
      fetchAttendeeDetails(qrCode.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Attendance Management</h2>
          <p className="text-sm text-gray-600">Scan QR codes to mark attendee attendance</p>
        </div>

        {/* Confirmation Modal */}
        {attendeeDetails && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 text-lg mb-4">Confirm Attendance</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between py-2 border-b border-blue-200">
                <span className="font-semibold text-blue-800">Name:</span>
                <span className="text-gray-900">{attendeeDetails.fullName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-200">
                <span className="font-semibold text-blue-800">Committee:</span>
                <span className="text-gray-900">{attendeeDetails.committee}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-200">
                <span className="font-semibold text-blue-800">Status:</span>
                <span className="text-gray-900">{attendeeDetails.checked}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-blue-200">
                <span className="font-semibold text-blue-800">Attended:</span>
                <span className="text-gray-900">{attendeeDetails.attended}</span>
              </div>
              {attendeeDetails.note && attendeeDetails.note !== 'No notes' && (
                <div className="py-2 border-b border-blue-200">
                  <span className="font-semibold text-blue-800">Note:</span>
                  <p className="text-gray-900 mt-1">{attendeeDetails.note}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmAttendance}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Confirm Attendance</span>
                  </>
                )}
              </button>
              <button
                onClick={cancelConfirmation}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* QR Code Scan Mode */}
        {!attendeeDetails && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <h3 className="font-semibold text-purple-900">Scan QR Code</h3>
            </div>

            {/* Camera Scanner */}
            {cameraActive && (
              <div className="mb-4 bg-black rounded-lg overflow-hidden">
                <div id="qr-reader-attendance" className="w-full"></div>
              </div>
            )}

            {/* Camera Controls */}
            <div className="mb-4">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Open Camera Scanner</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {/* Manual QR Input */}
            <div className="border-t border-purple-200 pt-4">
              <p className="text-xs text-purple-600 mb-2 font-medium">Or enter QR code manually:</p>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="qrCode"
                    className="block text-sm font-medium text-purple-900 mb-2"
                  >
                    QR Code Data
                  </label>
                  <input
                    id="qrCode"
                    type="text"
                    placeholder="Scan or paste QR code data..."
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    disabled={loading || cameraActive}
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !qrCode.trim() || cameraActive}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <span>Check Attendee</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-xs text-purple-700 mt-4">
              Use the camera to scan QR codes automatically, or enter the code manually
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-1">Attendance Tips:</p>
              <ul className="space-y-1 text-green-700">
                <li>• Attendance can be marked multiple times for the same attendee</li>
                <li>• QR codes are unique to each attendee and contain their ID</li>
                <li>• You can switch between manual entry and QR scanning at any time</li>
                <li>• Invalid IDs or QR codes will show an error message</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
