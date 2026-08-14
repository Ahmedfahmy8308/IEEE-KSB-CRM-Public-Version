// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  QrCode,
  CreditCard,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CommitteeStatsProps {
  committee: string;
  season?: string;
}

interface Stats {
  total: number;
  emailSent: number;
  attended: number;
  notAttended: number;
  validationPassed: number;
  validationNotChecked: number;
  validationFailed: number;
  paymentInstapay: number;
  paymentVodafoneCash: number;
  qrCodesGenerated: number;
}

export default function CommitteeStats({ committee, season }: CommitteeStatsProps) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCommittee = (comm: string) => {
    if (comm.toLowerCase().includes('invited') && comm.toLowerCase().includes('not in ieee')) {
      return 'Invited Attendees';
    }
    return comm;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const params = new URLSearchParams();
        if (committee && committee !== 'all') {
          params.append('committee', committee);
        }
        if (season) params.set('season', season);

        const res = await fetch(`/api/Welcome-Day/committee/stats?${params.toString()}`);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statsData = [
    {
      title: 'Total Registered',
      value: stats.total,
      icon: Users,
      iconColor: 'text-[#00629B]',
      iconBg: 'bg-blue-100/80 border-blue-200/80',
    },
    {
      title: 'Email Sent',
      value: stats.emailSent,
      icon: Mail,
      iconColor: 'text-purple-700',
      iconBg: 'bg-purple-100/80 border-purple-200/80',
    },
    {
      title: 'Attended',
      value: stats.attended,
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100/80 border-emerald-200/80',
    },
    {
      title: 'Absent / Pending',
      value: stats.notAttended,
      icon: XCircle,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100/80 border-rose-200/80',
    },
    {
      title: 'QR Generated',
      value: stats.qrCodesGenerated,
      icon: QrCode,
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100/80 border-indigo-200/80',
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {committee === 'all' ? 'All Committees' : formatCommittee(committee)} Statistics
            </h2>
            <p className="text-xs text-slate-500">Live attendance & ticketing summary</p>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="p-4 bg-white border border-slate-200 hover:border-purple-600/40 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-700 truncate leading-snug">
                  {stat.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon className="w-4 h-4 stroke-[2.25]" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {stat.value.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Payment Method Breakdown */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Payment Methods Distribution
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">Instapay Transfers</p>
              <p className="text-2xl font-black text-indigo-950">
                {stats.paymentInstapay.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 bg-cyan-50/60 border border-cyan-100 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">Vodafone Cash</p>
              <p className="text-2xl font-black text-cyan-950">
                {stats.paymentVodafoneCash.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
