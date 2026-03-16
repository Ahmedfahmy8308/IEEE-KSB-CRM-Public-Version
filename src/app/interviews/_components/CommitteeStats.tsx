// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Statistic, Typography, Skeleton } from 'antd';
import {
  MailOutlined,
  SafetyOutlined,
  TeamOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CheckSquareOutlined,
  PlayCircleOutlined,
  StopOutlined,
  UserAddOutlined,
  WarningOutlined,
  HomeOutlined,
  LaptopOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

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

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (committee && committee !== 'all') {
        params.append('committee', committee);
      }
      if (season) params.set('season', season);

      const res = await fetch(`/api/interviews/committee/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching committee stats:', error);
    } finally {
      setLoading(false);
    }
  }, [committee, season, router]);

  useEffect(() => {
    fetchStats();
  }, [committee, fetchStats]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 w-full max-w-full"
      >
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      </motion.div>
    );
  }

  if (!stats) return null;

  const statsData = [
    {
      title: 'Total Applicants',
      value: stats.total,
      icon: <TeamOutlined className="text-2xl" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: <SafetyOutlined className="text-2xl" />,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: <CloseCircleOutlined className="text-2xl" />,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: <ExclamationCircleOutlined className="text-2xl" />,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      title: 'Emails Sent',
      value: stats.emailSent,
      icon: <MailOutlined className="text-2xl" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Approved Email Sent',
      value: stats.approvedEmailSent,
      icon: <MailOutlined className="text-2xl" />,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckSquareOutlined className="text-2xl" />,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      title: 'Not Started',
      value: stats.notStarted,
      icon: <PlayCircleOutlined className="text-2xl" />,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Not Attended',
      value: stats.notAttended,
      icon: <StopOutlined className="text-2xl" />,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    // ID validation cards (shown in both seasons for fixed 15-card layout)
    ...(season === 'S2' || season === 'S1'
      ? [
          {
            title: 'ID Matched',
            value: stats.idMatched ?? 0,
            icon: <SafetyOutlined className="text-2xl" />,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
          },
          {
            title: 'ID New',
            value: stats.idNew ?? 0,
            icon: <UserAddOutlined className="text-2xl" />,
            color: 'sky',
            bgColor: 'bg-sky-50',
            iconColor: 'text-sky-600',
          },
          {
            title: 'ID Mismatch',
            value: stats.idMismatch ?? 0,
            icon: <WarningOutlined className="text-2xl" />,
            color: 'rose',
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600',
          },
          {
            title: 'ID Need Review',
            value: stats.idNeedReview ?? 0,
            icon: <ExclamationCircleOutlined className="text-2xl" />,
            color: 'orange',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
          },
        ]
      : []),
    {
      title: 'Physical',
      value: stats.physical ?? 0,
      icon: <HomeOutlined className="text-2xl" />,
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      title: 'Online',
      value: stats.online ?? 0,
      icon: <LaptopOutlined className="text-2xl" />,
      color: 'violet',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TeamOutlined className="text-2xl text-blue-600" />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {committee === 'all' ? 'All Committees' : committee} Statistics
              </Title>
              <Text type="secondary">Overview of applicants and interview progress</Text>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
              <Card
                className="shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                variant="borderless"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                    <span className={stat.iconColor}>{stat.icon}</span>
                  </div>
                  <div className="flex-1">
                    <Statistic
                      title={<Text className="text-sm text-gray-600">{stat.title}</Text>}
                      value={stat.value}
                      valueStyle={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                      }}
                    />
                  </div>
                </div>
              </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
