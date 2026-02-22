// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  user: {
    username: string;
    name: string;
    role: string;
    committee?: string;
  };
  activeTab:
    | 'dashboard'
    | 'search'
    | 'members'
    | 'email'
    | 'validation'
    | 'attendance'
    | 'qrcode'
    | 'pull';
  onTabChange: (
    tab:
      | 'dashboard'
      | 'search'
      | 'members'
      | 'email'
      | 'validation'
      | 'attendance'
      | 'qrcode'
      | 'pull'
  ) => void;
  onLogout: () => void;
  season?: string;
}

export default function Sidebar({
  user,
  activeTab,
  onTabChange,
  onLogout,
  season: _season,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-50 bg-white text-gray-700 p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 ${
          isOpen ? 'hidden' : 'block'
        }`}
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:fixed top-0 left-0 h-screen
          bg-white border-r border-gray-200
          shadow-xl lg:shadow-none z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 overflow-y-auto flex flex-col flex-shrink-0
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          {/* Logo and Title for Desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center mb-6 w-full">
            <div className="w-full flex justify-center">
              <div className="rounded-xl p-2.5 w-full flex justify-center">
                <Image
                  src="/Logo/Logo.png"
                  alt="IEEE KSB"
                  width={160}
                  height={80}
                  className="object-contain w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Logo and Title for Mobile */}
          <div className="flex lg:hidden items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-2.5 shadow-sm">
                <Image
                  src="/Logo/Logo2.png"
                  alt="IEEE KSB"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">IEEE KSB</h1>
                <p className="text-xs text-gray-500">Welcome Day</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
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

          {/* User Info - Mobile Only */}
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-blue-600 font-medium">{user.role}</p>
                {user.committee && (
                  <p className="text-xs text-gray-500 truncate">{user.committee}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => {
              onTabChange('dashboard');
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200 group
              ${
                activeTab === 'dashboard'
                  ? 'bg-[#064692] text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => {
              onTabChange('search');
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200 group
              ${
                activeTab === 'search'
                  ? 'bg-[#064692] text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="font-medium">Search Attendees</span>
          </button>

          {/* All Members - Chairman Only */}
          {user.role === 'ChairMan' && (
            <button
              onClick={() => {
                onTabChange('members');
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 group
                ${
                  activeTab === 'members'
                    ? 'bg-[#064692] text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="font-medium">All Members</span>
            </button>
          )}

          {/* Chairman Tools */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-between px-4 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Chairman Tools
              </p>
              {user.role !== 'ChairMan' && (
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
            </div>

            {/* Email Management */}
            <button
              onClick={() => {
                if (user.role === 'ChairMan') {
                  onTabChange('email');
                  setIsOpen(false);
                }
              }}
              disabled={user.role !== 'ChairMan'}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                user.role === 'ChairMan'
                  ? activeTab === 'email'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">Emails</span>
            </button>

            {/* Validation */}
            <button
              onClick={() => {
                if (user.role === 'ChairMan') {
                  onTabChange('validation');
                  setIsOpen(false);
                }
              }}
              disabled={user.role !== 'ChairMan'}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                user.role === 'ChairMan'
                  ? activeTab === 'validation'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Validation</span>
            </button>

            {/* Attendance */}
            <button
              onClick={() => {
                if (user.role === 'ChairMan') {
                  onTabChange('attendance');
                  setIsOpen(false);
                }
              }}
              disabled={user.role !== 'ChairMan'}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                user.role === 'ChairMan'
                  ? activeTab === 'attendance'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="font-medium">Attendance</span>
            </button>

            {/* QR Code */}
            <button
              onClick={() => {
                if (user.role === 'ChairMan') {
                  onTabChange('qrcode');
                  setIsOpen(false);
                }
              }}
              disabled={user.role !== 'ChairMan'}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                user.role === 'ChairMan'
                  ? activeTab === 'qrcode'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <span className="font-medium">QR Codes</span>
            </button>

            {/* Pull Records */}
            <button
              onClick={() => {
                if (user.role === 'ChairMan') {
                  onTabChange('pull');
                  setIsOpen(false);
                }
              }}
              disabled={user.role !== 'ChairMan'}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                user.role === 'ChairMan'
                  ? activeTab === 'pull'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="font-medium">Pull Records</span>
            </button>
          </div>
        </nav>

        {/* Home and Logout Buttons */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 font-medium group border border-blue-200"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Home</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium group border border-gray-300"
          >
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
