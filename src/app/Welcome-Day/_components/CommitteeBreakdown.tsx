// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useRouter, useSearchParams } from 'next/navigation';

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
    // Check if it's the "Invited (Only for Who Not in IEEE)" committee
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
    <div className="bg-gray-50 rounded-lg shadow p-6 w-full max-w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">By Committee</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {Object.entries(byCommittee).map(([committee, count]) => (
          <div
            key={committee}
            onClick={() => handleCommitteeClick(committee)}
            className={`border rounded p-3 ${
              isClickable
                ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all'
                : ''
            }`}
          >
            <p className="text-sm text-gray-600">{formatCommittee(committee)}</p>
            <p className="text-2xl font-bold text-blue-600">{count}</p>
            {isClickable && <p className="text-xs text-blue-500 mt-1">Click to view details</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
