// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';

interface PullSeasonConfig {
  active: boolean;
  originSheetId: string;
  originTabName: string;
}

interface AppConfig {
  sheetNames: {
    interview_s1: string;
    interview_s2: string;
    welcome_day_s1: string;
    welcome_day_s2: string;
    users: string;
  };
  email: {
    batchSize: number;
    batchDelayMs: number;
    testEmail: string;
  };
  pull: {
    interview_s1: PullSeasonConfig;
    interview_s2: PullSeasonConfig;
    welcome_day_s1: PullSeasonConfig;
    welcome_day_s2: PullSeasonConfig;
  };
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  season?: string;
  readOnly?: boolean;
}

export default function ConfigModal({ isOpen, onClose, readOnly }: ConfigModalProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'sheets' | 'email' | 'pull'>('sheets');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/config', { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Failed to load config';
        try {
          msg = JSON.parse(text).error || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = await res.json();
      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setSuccess(false);
      setEditing(false);
      setShowConfirm(false);
    }
  }, [isOpen, fetchConfig]);

  const handleSave = async () => {
    if (!config) return;
    setShowConfirm(false);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Failed to save config';
        try {
          msg = JSON.parse(text).error || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = await res.json();
      setConfig(data.config);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editing) {
      // Discard changes and reload
      setEditing(false);
      fetchConfig();
    } else {
      onClose();
    }
  };

  // Deep update helper
  const updateField = (path: string, value: string | number | boolean) => {
    if (!config || !editing) return;
    const keys = path.split('.');
    const newConfig = JSON.parse(JSON.stringify(config));

    let obj: Record<string, unknown> = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (!isOpen) return null;

  const inputClass = (extra?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm transition-all outline-none ${
      editing
        ? 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        : 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
    } ${extra || ''}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={editing ? undefined : onClose}
      />

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Confirm Changes</h3>
                <p className="text-sm text-gray-500">This will update the system configuration</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to save these changes? This will immediately affect how the
              system operates.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                Yes, Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">System Configuration</h2>
              <p className="text-xs text-gray-500">
                {editing ? (
                  <span className="text-amber-600 font-medium">
                    Editing mode — changes are not saved yet
                  </span>
                ) : (
                  'View runtime settings (config.json)'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing && (
              <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                EDITING
              </span>
            )}
            <button
              onClick={editing ? handleCancel : onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          {[
            {
              key: 'sheets' as const,
              label: 'Sheet Names',
              icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7',
            },
            {
              key: 'email' as const,
              label: 'Email',
              icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            },
            {
              key: 'pull' as const,
              label: 'Pull Records',
              icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeSection === tab.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-500">Loading config...</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
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
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
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
              Configuration saved successfully!
            </div>
          )}

          {config && !loading && (
            <>
              {/* Sheet Names Section */}
              {activeSection === 'sheets' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Google Sheet Tab Names</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    These are the tab/sheet names inside the main Google Spreadsheet for each module
                    and season.
                  </p>
                  {[
                    { key: 'interview_s1', label: 'Interview Season 1' },
                    { key: 'interview_s2', label: 'Interview Season 2' },
                    { key: 'welcome_day_s1', label: 'Welcome Day Season 1' },
                    { key: 'welcome_day_s2', label: 'Welcome Day Season 2' },
                    { key: 'users', label: 'Users' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {item.label}
                      </label>
                      <input
                        type="text"
                        value={(config.sheetNames as Record<string, string>)[item.key] || ''}
                        onChange={(e) => updateField(`sheetNames.${item.key}`, e.target.value)}
                        readOnly={!editing}
                        className={inputClass()}
                        placeholder={`Enter sheet name for ${item.label}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Email Section */}
              {activeSection === 'email' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Email Settings</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Configure email batch sending behavior and the test email address.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config.email.batchSize}
                      onChange={(e) =>
                        updateField('email.batchSize', parseInt(e.target.value) || 1)
                      }
                      readOnly={!editing}
                      className={inputClass()}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Number of emails to send per batch before pausing
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Delay (ms)
                    </label>
                    <input
                      type="number"
                      min={500}
                      max={30000}
                      step={500}
                      value={config.email.batchDelayMs}
                      onChange={(e) =>
                        updateField('email.batchDelayMs', parseInt(e.target.value) || 2000)
                      }
                      readOnly={!editing}
                      className={inputClass()}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Delay in milliseconds between each batch (
                      {(config.email.batchDelayMs / 1000).toFixed(1)}s)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Email Address
                    </label>
                    <input
                      type="email"
                      value={config.email.testEmail}
                      onChange={(e) => updateField('email.testEmail', e.target.value)}
                      readOnly={!editing}
                      className={inputClass()}
                      placeholder="test@example.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Email address used for test email sends
                    </p>
                  </div>
                </div>
              )}

              {/* Pull Records Section */}
              {activeSection === 'pull' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Pull Records Configuration</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Configure the origin Google Forms response spreadsheets to pull data from.
                  </p>

                  {[
                    { key: 'interview_s1', label: 'Interview S1' },
                    { key: 'interview_s2', label: 'Interview S2' },
                    { key: 'welcome_day_s1', label: 'Welcome Day S1' },
                    { key: 'welcome_day_s2', label: 'Welcome Day S2' },
                  ].map((item) => {
                    const pullCfg = (config.pull as Record<string, PullSeasonConfig>)[item.key];
                    return (
                      <div
                        key={item.key}
                        className={`p-4 border rounded-xl ${editing ? 'border-gray-200 bg-gray-50/50' : 'border-gray-200 bg-gray-50/30'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-800">{item.label}</h4>
                          {editing ? (
                            <button
                              onClick={() =>
                                updateField(`pull.${item.key}.active`, !pullCfg.active)
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                pullCfg.active ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                                  pullCfg.active ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : (
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                pullCfg.active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {pullCfg.active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Origin Sheet ID
                            </label>
                            <input
                              type="text"
                              value={pullCfg.originSheetId}
                              onChange={(e) =>
                                updateField(`pull.${item.key}.originSheetId`, e.target.value)
                              }
                              readOnly={!editing}
                              className={inputClass('font-mono text-xs')}
                              placeholder="Google Spreadsheet ID"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Origin Tab Name
                            </label>
                            <input
                              type="text"
                              value={pullCfg.originTabName}
                              onChange={(e) =>
                                updateField(`pull.${item.key}.originTabName`, e.target.value)
                              }
                              readOnly={!editing}
                              className={inputClass()}
                              placeholder="Sheet tab name"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {editing ? 'Discard Changes' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            {readOnly ? (
              <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-2">
                🔒 View Only
              </span>
            ) : !editing ? (
              <button
                onClick={() => setEditing(true)}
                disabled={loading || !config}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={saving || loading || !config}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
