// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';

interface PullPanelProps {
  onSuccess?: () => void;
  season?: string;
}

interface PullConfig {
  season: string;
  isActive: boolean;
  hasOriginSheet: boolean;
  hasTabName: boolean;
}

interface PullResult {
  message: string;
  totalInOrigin: number;
  pulled: number;
  skippedDuplicates: number;
}

export default function PullPanel({ onSuccess, season }: PullPanelProps) {
  const [config, setConfig] = useState<PullConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/Welcome-Day/pull${season ? `?season=${season}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load pull configuration');
      }
    } catch {
      setError('Failed to load pull configuration');
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handlePull = async () => {
    try {
      setPulling(true);
      setError(null);
      setResult(null);

      const res = await fetch(`/api/Welcome-Day/pull${season ? `?season=${season}` : ''}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        if (data.pulled > 0 && onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || 'Pull failed');
      }
    } catch {
      setError('Failed to pull records');
    } finally {
      setPulling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600">Loading pull configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pull Records from Form</h2>
            <p className="text-sm text-gray-500">
              Import new Welcome Day registrations from the Google Forms origin sheet
            </p>
          </div>
        </div>

        {/* Configuration Status */}
        {config && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg border ${config.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span
                  className={`text-sm font-medium ${config.isActive ? 'text-green-700' : 'text-red-700'}`}
                >
                  {config.isActive ? 'Pull Active' : 'Pull Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                welcome_day_{season?.toLowerCase()}.active
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${config.hasOriginSheet ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${config.hasOriginSheet ? 'bg-green-500' : 'bg-yellow-500'}`}
                ></div>
                <span
                  className={`text-sm font-medium ${config.hasOriginSheet ? 'text-green-700' : 'text-yellow-700'}`}
                >
                  {config.hasOriginSheet ? 'Sheet ID Set' : 'No Sheet ID'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Origin spreadsheet ID</p>
            </div>

            <div
              className={`p-4 rounded-lg border ${config.hasTabName ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${config.hasTabName ? 'bg-green-500' : 'bg-yellow-500'}`}
                ></div>
                <span
                  className={`text-sm font-medium ${config.hasTabName ? 'text-green-700' : 'text-yellow-700'}`}
                >
                  {config.hasTabName ? 'Tab Name Set' : 'No Tab Name'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Origin sheet tab name</p>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-purple-800 mb-2">How Welcome Day Pull Works</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Reads all form responses from the origin Google Sheet
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Skips records already imported (dedup by timestamp)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              New records are set to &quot;Not Checked&quot; validation status
            </li>
          </ul>
        </div>

        {/* Pull Button */}
        <button
          onClick={handlePull}
          disabled={pulling || !config?.isActive}
          className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
            pulling || !config?.isActive
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {pulling ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Pulling records...</span>
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
              <span>Pull New Records</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Pull Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Pull Results
          </h3>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{result.totalInOrigin}</p>
              <p className="text-xs text-gray-500 mt-1">Total in Origin</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{result.pulled}</p>
              <p className="text-xs text-gray-500 mt-1">New Records Pulled</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{result.skippedDuplicates}</p>
              <p className="text-xs text-gray-500 mt-1">Skipped (Duplicates)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
