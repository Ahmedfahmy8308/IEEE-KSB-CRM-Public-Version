// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Send,
  CheckSquare,
  PlayCircle,
  UserX,
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CommitteeStatsProps {
  committee: string;
  season?: string;
}

interface Stats {
  total: number;
  assigned: number;
  emailSent: number;
  approvedEmailSent: number;
  approved: number;
  rejected: number;
  pendingApproval: number;
  completed: number;
  notStarted: number;
  notAttended: number;
  inProgress: number;
  pending: number;
  idMatched?: number;
  idNew?: number;
  idMismatch?: number;
  idNeedReview?: number;
  physical?: number;
  online?: number;
}

export default function CommitteeStats({ committee, season }: CommitteeStatsProps) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const params = new URLSearchParams();
        if (committee && committee !== 'all') {
          params.append('committee', committee);
        }
        if (season) params.set('season', season);

        const res = await fetch(`/api/interviews/committee/stats?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setStats(data.stats);
        } else if (res.status === 401 && isMounted) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching committee stats:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [committee, season, router]);

  if (loading) {
    return (
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statsData = [
    {
      title: 'Total Applicants',
      value: stats.total,
      icon: Users,
      iconColor: 'text-[#00629B]',
      iconBg: 'bg-blue-100/90 border-blue-200',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100/90 border-emerald-200',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100/90 border-rose-200',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: Clock,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-100/90 border-amber-200',
    },
    {
      title: 'Invited Emails',
      value: stats.emailSent,
      icon: Mail,
      iconColor: 'text-purple-700',
      iconBg: 'bg-purple-100/90 border-purple-200',
    },
    {
      title: 'Result Emails Sent',
      value: stats.approvedEmailSent,
      icon: Send,
      iconColor: 'text-cyan-700',
      iconBg: 'bg-cyan-100/90 border-cyan-200',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckSquare,
      iconColor: 'text-teal-700',
      iconBg: 'bg-teal-100/90 border-teal-200',
    },
    {
      title: 'Not Started',
      value: stats.notStarted,
      icon: PlayCircle,
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100/90 border-indigo-200',
    },
    {
      title: 'Not Attended',
      value: stats.notAttended,
      icon: UserX,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100/90 border-rose-200',
    },
    ...(season === 'S2' || season === 'S1'
      ? [
          {
            title: 'ID Matched',
            value: stats.idMatched ?? 0,
            icon: ShieldCheck,
            iconColor: 'text-emerald-700',
            iconBg: 'bg-emerald-100/90 border-emerald-200',
          },
          {
            title: 'ID New Member',
            value: stats.idNew ?? 0,
            icon: UserPlus,
            iconColor: 'text-sky-700',
            iconBg: 'bg-sky-100/90 border-sky-200',
          },
          {
            title: 'ID Mismatch',
            value: stats.idMismatch ?? 0,
            icon: AlertTriangle,
            iconColor: 'text-rose-700',
            iconBg: 'bg-rose-100/90 border-rose-200',
          },
          {
            title: 'ID Review Needed',
            value: stats.idNeedReview ?? 0,
            icon: HelpCircle,
            iconColor: 'text-amber-700',
            iconBg: 'bg-amber-100/90 border-amber-200',
          },
        ]
      : []),
    {
      title: 'Physical Interview',
      value: stats.physical ?? 0,
      icon: MapPin,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100/90 border-emerald-200',
    },
    {
      title: 'Online Interview',
      value: stats.online ?? 0,
      icon: Globe,
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100/90 border-indigo-200',
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#00629B] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {committee === 'all' ? 'All Committees' : committee} Metrics
            </h2>
            <p className="text-xs text-slate-500">Live recruitment & evaluation summary</p>
          </div>
        </div>
      </motion.div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="p-4 bg-white border border-slate-200/90 hover:border-[#00629B]/30 rounded-2xl shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-medium text-slate-500 truncate">{stat.title}</span>
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-none">
                  {stat.value.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
