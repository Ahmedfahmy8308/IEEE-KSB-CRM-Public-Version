// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Statistic, Row, Col, Typography, Skeleton } from 'antd';
import {
  MailOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  StopOutlined,
  WalletOutlined,
  MobileOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

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

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (committee && committee !== 'all') {
        params.append('committee', committee);
      }
      if (season) params.set('season', season);

      const res = await fetch(`/api/Welcome-Day/committee/stats?${params.toString()}`);
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
      title: 'Total Attendees',
      value: stats.total,
      icon: <TeamOutlined className="text-2xl" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
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
      title: 'Attended',
      value: stats.attended,
      icon: <CheckCircleOutlined className="text-2xl" />,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Not Attended',
      value: stats.notAttended,
      icon: <CloseCircleOutlined className="text-2xl" />,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    // Validation Status Cards
    {
      title: 'Validation Passed',
      value: stats.validationPassed,
      icon: <SafetyOutlined className="text-2xl" />,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Not Checked',
      value: stats.validationNotChecked,
      icon: <ClockCircleOutlined className="text-2xl" />,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Validation Failed',
      value: stats.validationFailed,
      icon: <StopOutlined className="text-2xl" />,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'QR Codes Generated',
      value: stats.qrCodesGenerated,
      icon: <QrcodeOutlined className="text-2xl" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
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
                {committee === 'all' ? 'All Committees' : formatCommittee(committee)} Statistics
              </Title>
              <Text type="secondary">Overview of Welcome Day attendees</Text>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        {statsData.map((stat, index) => (
          <Col xs={12} sm={12} md={12} lg={12} xl={6} key={stat.title}>
            <motion.div
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
          </Col>
        ))}
      </Row>

      {/* Payment Methods Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="shadow-lg">
          <div className="mb-4">
            <Title level={4} style={{ margin: 0 }}>
              <WalletOutlined className="mr-2" />
              Payment Methods
            </Title>
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Card
                className="shadow-md hover:shadow-xl transition-all duration-300"
                variant="borderless"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <WalletOutlined className="text-2xl text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <Statistic
                      title={<Text className="text-sm text-gray-600">Instapay</Text>}
                      value={stats.paymentInstapay}
                      valueStyle={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                className="shadow-md hover:shadow-xl transition-all duration-300"
                variant="borderless"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <MobileOutlined className="text-2xl text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <Statistic
                      title={<Text className="text-sm text-gray-600">Vodafone Cash</Text>}
                      value={stats.paymentVodafoneCash}
                      valueStyle={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </motion.div>
    </div>
  );
}
