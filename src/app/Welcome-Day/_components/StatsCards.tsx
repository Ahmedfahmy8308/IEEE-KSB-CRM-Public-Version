// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import {
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  QrCode,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: {
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
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const statsData = [
    {
      title: 'Total Attendees',
      value: stats.total,
      icon: Users,
      iconColor: 'text-[#00629B]',
      iconBg: 'bg-blue-100/90 border-blue-200',
    },
    {
      title: 'Emails Sent',
      value: stats.emailSent,
      icon: Mail,
      iconColor: 'text-purple-700',
      iconBg: 'bg-purple-100/90 border-purple-200',
    },
    {
      title: 'Attended',
      value: stats.attended,
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100/90 border-emerald-200',
    },
    {
      title: 'Not Attended',
      value: stats.notAttended,
      icon: XCircle,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100/90 border-rose-200',
    },
    {
      title: 'Validation Passed',
      value: stats.validationPassed,
      icon: ShieldCheck,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100/90 border-emerald-200',
    },
    {
      title: 'Not Checked',
      value: stats.validationNotChecked,
      icon: Clock,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-100/90 border-amber-200',
    },
    {
      title: 'Validation Failed',
      value: stats.validationFailed,
      icon: XCircle,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-100/90 border-rose-200',
    },
    {
      title: 'QR Codes Generated',
      value: stats.qrCodesGenerated,
      icon: QrCode,
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100/90 border-indigo-200',
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 w-full">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="p-4 bg-white border border-slate-200/90 hover:border-purple-600/30 rounded-2xl shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
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

      {/* Payment Method Distribution */}
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
