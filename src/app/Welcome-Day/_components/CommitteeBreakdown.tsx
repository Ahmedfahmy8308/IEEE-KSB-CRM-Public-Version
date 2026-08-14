// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq-tech.com// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Layers, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommitteeBreakdownProps {
  byCommittee: Record<string, number>;
  userRole: string;
  season?: string;
}

export default function CommitteeBreakdown({
  byCommittee,
  userRole,
  season,
}: CommitteeBreakdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (Object.keys(byCommittee).length === 0) {
    return null;
  }

  const isClickable = userRole === 'ChairMan' || userRole === 'highboard';

  const formatCommittee = (committee: string) => {
    if (
      committee.toLowerCase().includes('invited') &&
      committee.toLowerCase().includes('not in ieee')
    ) {
      return 'Invited';
    }
    return committee;
  };

  const handleCommitteeClick = (committee: string) => {
    if (isClickable) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('committee', committee);
      router.push(`/Welcome-Day/${season}?${params.toString()}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs w-full max-w-full space-y-4"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">By Committee</h2>
          <p className="text-xs text-slate-500">Attendance breakdown per committee</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
        {Object.entries(byCommittee).map(([committee, count], index) => (
          <motion.div
            key={committee}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            onClick={() => handleCommitteeClick(committee)}
            className={`group p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl transition-all duration-200 flex flex-col justify-between ${
              isClickable
                ? 'cursor-pointer hover:bg-purple-50/60 hover:border-purple-600/30 hover:shadow-xs'
                : ''
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-600 group-hover:text-purple-700 transition-colors truncate">
                {formatCommittee(committee)}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {count.toLocaleString()}
              </p>
            </div>
            {isClickable && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-purple-700 mt-2 group-hover:translate-x-0.5 transition-all">
                <span>View details</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
