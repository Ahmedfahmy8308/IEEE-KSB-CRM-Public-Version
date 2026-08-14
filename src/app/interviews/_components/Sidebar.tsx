// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Radio,
  Calendar,
  Mail,
  CheckCircle2,
  Database,
  Settings,
  Home,
  LogOut,
  X,
  Menu,
  Lock,
  Send,
} from 'lucide-react';
import ConfigModal from './ConfigModal';

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
    | 'schedule'
    | 'email'
    | 'validation'
    | 'active-interviews'
    | 'approved-email'
    | 'pull';
  onTabChange: (
    tab: 'dashboard' | 'search' | 'schedule' | 'email' | 'validation' | 'approved-email' | 'pull'
  ) => void;
  onLogout: () => void;
  season?: string;
}

export default function Sidebar({ user, activeTab, onTabChange, onLogout, season }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const router = useRouter();
  const canAccessTools = user.role === 'ChairMan' || user.role === 'highboard';

  return (
    <>
      {/* Mobile Menu Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed top-3.5 left-3.5 z-40 bg-white text-slate-700 p-2.5 min-w-[44px] min-h-[44px] rounded-xl shadow-md border border-slate-200/90 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
          isOpen ? 'hidden' : 'flex'
        }`}
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 text-slate-800" />
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen
          bg-white border-r border-slate-200/90
          shadow-2xl lg:shadow-none z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 overflow-y-auto flex flex-col flex-shrink-0 select-none
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-9">
              <Image src="/Logo/Logo.png" alt="IEEE KSB" fill className="object-contain" priority />
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00629B] to-[#004879] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate leading-none">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-semibold text-[#00629B] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                  {user.role}
                </span>
                {season && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                    {season}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
            General
          </div>

          <button
            onClick={() => {
              onTabChange('dashboard');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30'
                : 'text-slate-700 hover:bg-slate-100/90'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => {
              onTabChange('search');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30'
                : 'text-slate-700 hover:bg-slate-100/90'
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span>Search Applicants</span>
          </button>

          <button
            onClick={() => {
              router.push(`/interviews/${season}/active-interviews`);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'active-interviews'
                ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30'
                : 'text-slate-700 hover:bg-slate-100/90'
            }`}
          >
            <div className="flex items-center gap-3">
              <Radio className="w-4 h-4 flex-shrink-0" />
              <span>Active Interviews</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Chairman / Highboard Tools */}
          <div className="pt-4 mt-3 border-t border-slate-100">
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Management Tools
              </span>
              {!canAccessTools && <Lock className="w-3 h-3 text-slate-400" />}
            </div>

            <button
              onClick={() => {
                if (canAccessTools) {
                  onTabChange('schedule');
                  setIsOpen(false);
                }
              }}
              disabled={!canAccessTools}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 ${
                canAccessTools
                  ? activeTab === 'schedule'
                    ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30 cursor-pointer'
                    : 'text-slate-700 hover:bg-slate-100/90 cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Schedule Manager</span>
            </button>

            <button
              onClick={() => {
                if (canAccessTools) {
                  onTabChange('email');
                  setIsOpen(false);
                }
              }}
              disabled={!canAccessTools}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 ${
                canAccessTools
                  ? activeTab === 'email'
                    ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30 cursor-pointer'
                    : 'text-slate-700 hover:bg-slate-100/90 cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>Interview Invitations</span>
            </button>

            <button
              onClick={() => {
                if (canAccessTools) {
                  onTabChange('approved-email');
                  setIsOpen(false);
                }
              }}
              disabled={!canAccessTools}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 ${
                canAccessTools
                  ? activeTab === 'approved-email'
                    ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30 cursor-pointer'
                    : 'text-slate-700 hover:bg-slate-100/90 cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 flex-shrink-0" />
              <span>Accept / Reject Emails</span>
            </button>

            <button
              onClick={() => {
                if (canAccessTools) {
                  onTabChange('validation');
                  setIsOpen(false);
                }
              }}
              disabled={!canAccessTools}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 ${
                canAccessTools
                  ? activeTab === 'validation'
                    ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30 cursor-pointer'
                    : 'text-slate-700 hover:bg-slate-100/90 cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Data Validation</span>
            </button>

            <button
              onClick={() => {
                if (canAccessTools) {
                  onTabChange('pull');
                  setIsOpen(false);
                }
              }}
              disabled={!canAccessTools}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all duration-150 ${
                canAccessTools
                  ? activeTab === 'pull'
                    ? 'bg-[#00629B] text-white shadow-sm shadow-[#00629B]/30 cursor-pointer'
                    : 'text-slate-700 hover:bg-slate-100/90 cursor-pointer'
                  : 'text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>Pull from Form</span>
            </button>

            {user.role === 'ChairMan' && (
              <button
                onClick={() => {
                  setConfigOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 transition-all duration-150 cursor-pointer"
              >
                <Settings className="w-4 h-4 flex-shrink-0 text-slate-500" />
                <span>System Config</span>
              </button>
            )}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 min-h-[40px] bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Home Hub</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 min-h-[40px] bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* System Config Modal */}
      <ConfigModal
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        season={season}
        readOnly={user.role !== 'ChairMan'}
      />
    </>
  );
}
