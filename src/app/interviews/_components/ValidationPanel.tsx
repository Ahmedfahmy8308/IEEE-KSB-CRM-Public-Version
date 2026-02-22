// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

interface ValidationResult {
  duplicatePhones: Array<{
    phone: string;
    members: Array<{ id: string; fullName: string; email: string }>;
  }>;
  duplicateEmails: Array<{
    email: string;
    members: Array<{ id: string; fullName: string; email: string }>;
  }>;
  duplicateEmailAddresses: Array<{
    emailAddress: string;
    members: Array<{ id: string; fullName: string; email: string }>;
  }>;
  emailMismatches: Array<{ id: string; fullName: string; email: string; emailAddress: string }>;
}

interface ValidationSummary {
  duplicatePhones: number;
  duplicateEmails: number;
  duplicateEmailAddresses: number;
  emailMismatches: number;
  totalIssues: number;
}

export default function ValidationPanel({ season }: { season?: string }) {
  const { showToast } = useToast();
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const runValidations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/validation${season ? `?season=${season}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setValidationResults(data.validations);
        setSummary(data.summary);
        showToast('Validations completed successfully', 'success');
      } else {
        showToast('Failed to run validations', 'error');
      }
    } catch (error: unknown) {
      console.error('Failed to run validations:', error);
      showToast('Failed to run validations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-white rounded-lg shadow w-full max-w-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Data Validation</h2>
          <p className="text-sm text-gray-600">Check for data quality issues in the system</p>
        </div>

        {/* Run Validation Button */}
        <button
          onClick={runValidations}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin text-xl">⏳</span>
              <span>Running Validation...</span>
            </>
          ) : (
            <span>Run Full Validation Check</span>
          )}
        </button>

        {/* Validation Results */}
        {summary && validationResults && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      summary.duplicatePhones > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {summary.duplicatePhones > 0 ? 'Issues' : 'Clear'}
                  </span>
                </div>
                <p className="text-sm text-blue-700 font-medium mb-1">Duplicate Phones</p>
                <p className="text-3xl font-bold text-blue-900">{summary.duplicatePhones}</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      summary.duplicateEmails > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {summary.duplicateEmails > 0 ? 'Issues' : 'Clear'}
                  </span>
                </div>
                <p className="text-sm text-yellow-700 font-medium mb-1">Duplicate Emails</p>
                <p className="text-3xl font-bold text-yellow-900">{summary.duplicateEmails}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      summary.duplicateEmailAddresses > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {summary.duplicateEmailAddresses > 0 ? 'Issues' : 'Clear'}
                  </span>
                </div>
                <p className="text-sm text-purple-700 font-medium mb-1">Duplicate Form Emails</p>
                <p className="text-3xl font-bold text-purple-900">
                  {summary.duplicateEmailAddresses}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      summary.emailMismatches > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {summary.emailMismatches > 0 ? 'Issues' : 'Clear'}
                  </span>
                </div>
                <p className="text-sm text-red-700 font-medium mb-1">Email Mismatches</p>
                <p className="text-3xl font-bold text-red-900">{summary.emailMismatches}</p>
              </div>
            </div>

            {/* Total Issues Banner */}
            <div
              className={`rounded-lg p-4 border-2 ${
                summary.totalIssues === 0
                  ? 'bg-green-50 border-green-300'
                  : 'bg-orange-50 border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p
                      className={`font-bold text-lg ${
                        summary.totalIssues === 0 ? 'text-green-800' : 'text-orange-800'
                      }`}
                    >
                      {summary.totalIssues === 0
                        ? 'All Clear!'
                        : `${summary.totalIssues} Total Issues Found`}
                    </p>
                    <p
                      className={`text-sm ${
                        summary.totalIssues === 0 ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {summary.totalIssues === 0
                        ? 'No validation issues detected in the system'
                        : 'Please review and resolve the issues below'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Results - Collapsible Sections */}
            <div className="space-y-3">
              {/* Duplicate Phones */}
              {validationResults.duplicatePhones.length > 0 && (
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('phones')}
                    className="w-full bg-blue-50 px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <h3 className="font-semibold text-blue-900">Duplicate Phone Numbers</h3>
                        <p className="text-xs text-blue-600">
                          {validationResults.duplicatePhones.length} duplicates found
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-blue-600 transform transition-transform ${
                        expandedSection === 'phones' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSection === 'phones' && (
                    <div className="p-4 bg-white space-y-3 max-h-96 overflow-y-auto">
                      {validationResults.duplicatePhones.map((dup, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                        >
                          <p className="font-semibold text-blue-900 mb-2">Phone: {dup.phone}</p>
                          <ul className="space-y-1 text-sm">
                            {dup.members.map((member, idx) => (
                              <li key={idx} className="text-blue-700 pl-4 py-1">
                                <div className="font-medium">{member.fullName}</div>
                                <div className="text-xs text-blue-600">
                                  ID: {member.id} | Email: {member.email}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Duplicate Emails */}
              {validationResults.duplicateEmails.length > 0 && (
                <div className="border border-yellow-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('emails')}
                    className="w-full bg-yellow-50 px-4 py-3 flex items-center justify-between hover:bg-yellow-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <h3 className="font-semibold text-yellow-900">Duplicate Contact Emails</h3>
                        <p className="text-xs text-yellow-600">
                          {validationResults.duplicateEmails.length} duplicates found
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-yellow-600 transform transition-transform ${
                        expandedSection === 'emails' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSection === 'emails' && (
                    <div className="p-4 bg-white space-y-3 max-h-96 overflow-y-auto">
                      {validationResults.duplicateEmails.map((dup, index) => (
                        <div
                          key={index}
                          className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"
                        >
                          <p className="font-semibold text-yellow-900 mb-2">
                            Contact Email: {dup.email}
                          </p>
                          <ul className="space-y-1 text-sm">
                            {dup.members.map((member, idx) => (
                              <li key={idx} className="text-yellow-700 pl-4 py-1">
                                <div className="font-medium">{member.fullName}</div>
                                <div className="text-xs text-yellow-600">ID: {member.id}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Duplicate Email Addresses */}
              {validationResults.duplicateEmailAddresses.length > 0 && (
                <div className="border border-purple-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('emailAddresses')}
                    className="w-full bg-purple-50 px-4 py-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <h3 className="font-semibold text-purple-900">
                          Duplicate Form Email Addresses
                        </h3>
                        <p className="text-xs text-purple-600">
                          {validationResults.duplicateEmailAddresses.length} duplicates found
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-purple-600 transform transition-transform ${
                        expandedSection === 'emailAddresses' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSection === 'emailAddresses' && (
                    <div className="p-4 bg-white space-y-3 max-h-96 overflow-y-auto">
                      {validationResults.duplicateEmailAddresses.map((dup, index) => (
                        <div
                          key={index}
                          className="bg-purple-50 p-3 rounded-lg border border-purple-200"
                        >
                          <p className="font-semibold text-purple-900 mb-2">
                            Form Email: {dup.emailAddress}
                          </p>
                          <ul className="space-y-1 text-sm">
                            {dup.members.map((member, idx) => (
                              <li key={idx} className="text-purple-700 pl-4 py-1">
                                <div className="font-medium">{member.fullName}</div>
                                <div className="text-xs text-purple-600">
                                  ID: {member.id} | Contact Email: {member.email}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Email Mismatches */}
              {validationResults.emailMismatches.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('mismatches')}
                    className="w-full bg-red-50 px-4 py-3 flex items-center justify-between hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <h3 className="font-semibold text-red-900">Email Mismatches</h3>
                        <p className="text-xs text-red-600">
                          {validationResults.emailMismatches.length} mismatches found
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-red-600 transform transition-transform ${
                        expandedSection === 'mismatches' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSection === 'mismatches' && (
                    <div className="p-4 bg-white space-y-3 max-h-96 overflow-y-auto">
                      {validationResults.emailMismatches.map((mismatch, index) => (
                        <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <p className="font-semibold text-red-900 mb-2">{mismatch.fullName}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-red-700 pl-4">
                              <span className="font-medium">ID:</span> {mismatch.id}
                            </p>
                            <p className="text-red-700 pl-4">
                              <span className="font-medium">Contact Email:</span> {mismatch.email}
                            </p>
                            <p className="text-red-700 pl-4">
                              <span className="font-medium">Form Email:</span>{' '}
                              {mismatch.emailAddress}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="text-sm text-indigo-800">
              <p className="font-semibold mb-1">Validation Categories:</p>
              <ul className="space-y-1 text-indigo-700">
                <li>
                  • <strong>Duplicate Phones:</strong> Multiple members with the same phone number
                </li>
                <li>
                  • <strong>Duplicate Emails:</strong> Multiple members with the same contact email
                </li>
                <li>
                  • <strong>Duplicate Form Emails:</strong> Multiple members with the same form
                  submission email
                </li>
                <li>
                  • <strong>Email Mismatches:</strong> Contact email differs from form email
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
