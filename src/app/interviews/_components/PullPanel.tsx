// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';

interface PullPanelProps {
  onSuccess?: () => void;
  season?: string;
  readOnly?: boolean;
}

interface PullConfig {
  season: string;
  isActive: boolean;
  hasOriginSheet: boolean;
  hasTabName: boolean;
  lastPullTimestamp: string | null;
}

interface PullResult {
  message: string;
  totalInOrigin: number;
  pulled: number;
  skippedDuplicates: number;
  validation: {
    matched: number;
    needReview: number;
    wrongId: number;
    noId: number;
  };
}

export default function PullPanel({ onSuccess, season, readOnly }: PullPanelProps) {
  const [config, setConfig] = useState<PullConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interviews/pull${season ? `?season=${season}` : ''}`);
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

      const res = await fetch(`/api/interviews/pull${season ? `?season=${season}` : ''}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        fetchConfig(); // Refresh to show updated timestamp
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

  const handleResetTimestamp = async () => {
    setShowResetConfirm(false);
    try {
      setResetting(true);
      setError(null);

      const res = await fetch(`/api/interviews/pull${season ? `?season=${season}` : ''}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchConfig(); // Refresh to show cleared timestamp
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset timestamp');
      }
    } catch {
      setError('Failed to reset timestamp');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading pull configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reset Pull Timestamp</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will clear the timestamp filter. The next pull will re-import all records from the origin sheet that are not already in the database.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetTimestamp}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Reset Timestamp
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
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
              Import new responses from the Google Forms origin sheet into the database
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
              <p className="text-xs text-gray-500 mt-1">PULL_INTERVIEW_{season}_ACTIVE</p>
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

        {/* S2 Validation Info */}
        {season === 'S2' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">S2 ID Validation Rules</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <strong>Matched:</strong> S1 ID + Phone both match → Auto-approved, same ID carried
                over
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <strong>Need Review:</strong> S1 ID matches but phone doesn&#39;t → Manual review
                needed
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <strong>Wrong ID:</strong> Entered ID doesn&#39;t match any S1 record → New ID
                generated
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <strong>No ID:</strong> No S1 ID was entered → New ID generated
              </li>
            </ul>
          </div>
        )}

        {/* Pull Button */}
        <div className="flex gap-3">
          <button
            onClick={handlePull}
            disabled={pulling || !config?.isActive || readOnly}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              pulling || !config?.isActive
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
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

          {config?.lastPullTimestamp && (
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting || readOnly}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                resetting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300'
              }`}
              title="Reset the timestamp filter to allow re-importing all records"
            >
              {resetting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="text-sm">Reset</span>
            </button>
          )}
        </div>

        {/* Last Pull Timestamp */}
        {config?.lastPullTimestamp && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700">
              Last pull cutoff: <strong>{new Date(config.lastPullTimestamp).toLocaleString()}</strong>
              <span className="text-blue-500 ml-1">(only records newer than this will be imported)</span>
            </span>
          </div>
        )}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {result.totalInOrigin - result.pulled - result.skippedDuplicates}
              </p>
              <p className="text-xs text-gray-500 mt-1">Other</p>
            </div>
          </div>

          {/* Validation Breakdown */}
          {season === 'S2' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                S1 ID Validation Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-lg font-bold text-green-700">{result.validation.matched}</p>
                    <p className="text-xs text-green-600">Matched</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div>
                    <p className="text-lg font-bold text-yellow-700">
                      {result.validation.needReview}
                    </p>
                    <p className="text-xs text-yellow-600">Need Review</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 rounded-lg p-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-lg font-bold text-red-700">{result.validation.wrongId}</p>
                    <p className="text-xs text-red-600">Wrong ID</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <div>
                    <p className="text-lg font-bold text-gray-700">{result.validation.noId}</p>
                    <p className="text-xs text-gray-600">No S1 ID</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
