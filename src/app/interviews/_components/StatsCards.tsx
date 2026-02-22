// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Card, Statistic, Row, Col } from 'antd';
import {
  TeamOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SafetyOutlined,
  UserAddOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: {
    total: number;
    assigned: number;
    emailSent: number;
    approved: number;
    rejected: number;
    pending: number;
    completed: number;
    notStarted: number;
    notAttended: number;
    idMatched?: number;
    idNew?: number;
    idMismatch?: number;
    idNeedReview?: number;
  };
  season?: string;
}

export default function StatsCards({ stats, season }: StatsCardsProps) {
  const statsData = [
    {
      title: 'Total Applicants',
      value: stats.total,
      icon: <TeamOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      iconBgColor: 'rgba(147, 197, 253, 0.2)',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      iconBgColor: 'rgba(110, 231, 183, 0.2)',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: <CloseCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      iconBgColor: 'rgba(252, 165, 165, 0.2)',
    },
    {
      title: 'Pending Approval',
      value: stats.pending,
      icon: <ClockCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      iconBgColor: 'rgba(251, 191, 36, 0.2)',
    },
    {
      title: 'Emails Sent',
      value: stats.emailSent,
      icon: <MailOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      iconBgColor: 'rgba(216, 180, 254, 0.2)',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckSquareOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      iconBgColor: 'rgba(196, 181, 253, 0.2)',
    },
    {
      title: 'Not Started',
      value: stats.notStarted,
      icon: <PlayCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      iconBgColor: 'rgba(165, 180, 252, 0.2)',
    },
    {
      title: 'Not Attended',
      value: stats.notAttended,
      icon: <StopOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      iconBgColor: 'rgba(252, 165, 165, 0.2)',
    },
    // S2-only cards
    ...(season === 'S2'
      ? [
          {
            title: 'ID Matched',
            value: stats.idMatched ?? 0,
            icon: <SafetyOutlined style={{ fontSize: '32px', color: '#fff' }} />,
            bgGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            iconBgColor: 'rgba(52, 211, 153, 0.2)',
          },
          {
            title: 'ID New',
            value: stats.idNew ?? 0,
            icon: <UserAddOutlined style={{ fontSize: '32px', color: '#fff' }} />,
            bgGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            iconBgColor: 'rgba(125, 211, 252, 0.2)',
          },
          {
            title: 'ID Mismatch',
            value: stats.idMismatch ?? 0,
            icon: <WarningOutlined style={{ fontSize: '32px', color: '#fff' }} />,
            bgGradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            iconBgColor: 'rgba(251, 113, 133, 0.2)',
          },
          {
            title: 'ID Need Review',
            value: stats.idNeedReview ?? 0,
            icon: <ExclamationCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
            bgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            iconBgColor: 'rgba(253, 186, 116, 0.2)',
          },
        ]
      : []),
  ];

  return (
    <Row gutter={[24, 24]} className="w-full">
      {statsData.map((stat, index) => (
        <Col xs={24} sm={12} lg={12} xl={6} key={stat.title}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              variant="borderless"
              style={{ background: stat.bgGradient }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Statistic
                    title={
                      <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                        {stat.title}
                      </span>
                    }
                    value={stat.value}
                    valueStyle={{
                      color: '#ffffff',
                      fontSize: '28px',
                      fontWeight: 'bold',
                    }}
                  />
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: stat.iconBgColor }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      ))}
    </Row>
  );
}
