// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function QRCodePanel({ season }: { season?: string }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateQRCodes = async () => {
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/Welcome-Day/qrcode/generate${season ? `?season=${season}` : ''}`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast(data.message, 'success');
        // Optionally trigger a download or show QR codes
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Failed to generate QR codes', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQRCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/Welcome-Day/qrcode/download${season ? `?season=${season}` : ''}`
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'welcome-day-qrcodes.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('QR codes downloaded successfully', 'success');
      } else {
        showToast('Failed to download QR codes', 'error');
      }
    } catch {
      showToast('Failed to download QR codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">QR Code Management</h2>
          <p className="text-sm text-gray-600">
            Generate and download QR codes for all Welcome Day attendees
          </p>
        </div>

        {/* Generate QR Codes */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
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
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Generate QR Codes</h3>
              <p className="text-sm text-blue-700">
                Create unique QR codes for all attendees in the system. Each QR code contains the
                attendee&apos;s unique ID for quick check-in.
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateQRCodes}
            disabled={generating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>Generating QR Codes...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Generate All QR Codes</span>
              </>
            )}
          </button>
        </div>

        {/* Download QR Codes */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">Download QR Codes</h3>
              <p className="text-sm text-green-700">
                Download all generated QR codes as a ZIP file. You can then print them or distribute
                them to attendees.
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadQRCodes}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-xl">⏳</span>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Download QR Codes (ZIP)</span>
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
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
            <div className="text-sm text-purple-800">
              <p className="font-semibold mb-1">QR Code Information:</p>
              <ul className="space-y-1 text-purple-700">
                <li>• Each QR code is unique and contains the attendee&apos;s ID</li>
                <li>
                  • QR codes are stored in the{' '}
                  <code className="bg-purple-100 px-1 rounded">public/Welcome-Day/qrcode</code>{' '}
                  directory
                </li>
                <li>• Regenerating QR codes will overwrite existing ones</li>
                <li>• Use the Attendance panel to scan QR codes during check-in</li>
                <li>• Downloaded ZIP file contains all QR codes as PNG images</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">How to Use:</p>
              <ol className="space-y-1 text-yellow-700 list-decimal list-inside">
                <li>
                  Click &quot;Generate All QR Codes&quot; to create QR codes for all attendees
                </li>
                <li>Click &quot;Download QR Codes&quot; to get a ZIP file with all codes</li>
                <li>Extract and print the QR codes</li>
                <li>Distribute QR codes to attendees before the event</li>
                <li>Use the Attendance panel to scan codes during check-in</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
