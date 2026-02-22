// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { Card, Statistic, Row, Col, Typography } from 'antd';
import {
  TeamOutlined,
  MailOutlined,
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

const { Title } = Typography;

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
      icon: <TeamOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      iconBgColor: 'rgba(147, 197, 253, 0.2)',
    },
    {
      title: 'Emails Sent',
      value: stats.emailSent,
      icon: <MailOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      iconBgColor: 'rgba(216, 180, 254, 0.2)',
    },
    {
      title: 'Attended',
      value: stats.attended,
      icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      iconBgColor: 'rgba(110, 231, 183, 0.2)',
    },
    {
      title: 'Not Attended',
      value: stats.notAttended,
      icon: <CloseCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      iconBgColor: 'rgba(252, 165, 165, 0.2)',
    },
    {
      title: 'Validation Passed',
      value: stats.validationPassed,
      icon: <SafetyOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      iconBgColor: 'rgba(110, 231, 183, 0.2)',
    },
    {
      title: 'Not Checked',
      value: stats.validationNotChecked,
      icon: <ClockCircleOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      iconBgColor: 'rgba(251, 146, 60, 0.2)',
    },
    {
      title: 'Validation Failed',
      value: stats.validationFailed,
      icon: <StopOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      iconBgColor: 'rgba(252, 165, 165, 0.2)',
    },
    {
      title: 'QR Codes Generated',
      value: stats.qrCodesGenerated,
      icon: <QrcodeOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      iconBgColor: 'rgba(196, 181, 253, 0.2)',
    },
  ];

  const paymentData = [
    {
      title: 'Instapay',
      value: stats.paymentInstapay,
      icon: <WalletOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      iconBgColor: 'rgba(165, 180, 252, 0.2)',
    },
    {
      title: 'Vodafone Cash',
      value: stats.paymentVodafoneCash,
      icon: <MobileOutlined style={{ fontSize: '32px', color: '#fff' }} />,
      bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      iconBgColor: 'rgba(103, 232, 249, 0.2)',
    },
  ];

  return (
    <div className="space-y-6 w-full">
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

      {/* Payment Methods Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Card
          className="shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
        >
          <div className="mb-4">
            <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
              <WalletOutlined className="mr-2" />
              Payment Methods
            </Title>
          </div>
          <Row gutter={24}>
            {paymentData.map((payment, index) => (
              <Col xs={24} sm={12} key={payment.title}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                >
                  <Card
                    className="shadow-md hover:shadow-xl transition-all duration-300"
                    variant="borderless"
                    style={{ background: payment.bgGradient }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Statistic
                          title={
                            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                              {payment.title}
                            </span>
                          }
                          value={payment.value}
                          valueStyle={{
                            color: '#ffffff',
                            fontSize: '28px',
                            fontWeight: 'bold',
                          }}
                        />
                      </div>
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: payment.iconBgColor }}
                      >
                        {payment.icon}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Card>
      </motion.div>
    </div>
  );
}
