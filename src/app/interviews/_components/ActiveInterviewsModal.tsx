// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Active Interviews Modal Component
 * Displays members who are currently waiting in reception or in interview
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Modal, Card, Badge, Space, Spin, Empty, Alert, Tag, Divider } from 'antd';
import {
  CloseOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  IdcardOutlined,
  TeamOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { INTERVIEW_STATE } from '@/lib/constants';

interface Member {
  id: string;
  fullName: string;
  trackApplying: string;
  state: string;
  interviewTime?: string;
  phoneNumber?: string;
  email?: string;
}

interface ActiveInterviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userCommittee?: string;
  season?: string;
}

export default function ActiveInterviewsModal({
  isOpen,
  onClose,
  userRole,
  userCommittee,
  season,
}: ActiveInterviewsModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/members/active${season ? `?season=${season}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      } else {
        setError('Failed to fetch active members');
      }
    } catch (err) {
      setError('An error occurred while fetching members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    if (isOpen) {
      fetchActiveMembers();
      // Refresh every 30 seconds while modal is open
      const interval = setInterval(fetchActiveMembers, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchActiveMembers]);

  if (!isOpen) return null;

  const inInterviewMembers = members.filter((m) => m.state === INTERVIEW_STATE.IN_INTERVIEW);
  const waitingMembers = members.filter((m) => m.state === INTERVIEW_STATE.WAIT_IN_RECEPTION);

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      closeIcon={<CloseOutlined />}
      title={
        <Space direction="vertical" size={0}>
          <Space>
            <TeamOutlined className="text-blue-500" />
            <span className="text-xl font-bold">Active Interviews</span>
          </Space>
          <span className="text-sm font-normal text-gray-500">
            {userRole === 'board' && userCommittee
              ? `Showing members for ${userCommittee} committee`
              : 'All committees'}
          </span>
        </Space>
      }
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            tip="Loading active interviews..."
          />
        </div>
      )}

      {error && <Alert message="Error" description={error} type="error" showIcon closable />}

      {!loading && !error && members.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <span className="text-gray-500">No active interviews at the moment</span>
              <span className="text-xs text-gray-400">Auto-refreshes every 30 seconds</span>
            </Space>
          }
        />
      )}

      {!loading && !error && members.length > 0 && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* In Interview Section */}
          {inInterviewMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge status="processing" />
                <h3 className="text-lg font-semibold text-gray-900 m-0">
                  In Interview ({inInterviewMembers.length})
                </h3>
              </div>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <AnimatePresence>
                  {inInterviewMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MemberCard member={member} status="in-interview" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Space>
            </div>
          )}

          {/* Divider if both sections exist */}
          {inInterviewMembers.length > 0 && waitingMembers.length > 0 && <Divider />}

          {/* Waiting in Reception Section */}
          {waitingMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge status="default" color="blue" />
                <h3 className="text-lg font-semibold text-gray-900 m-0">
                  Waiting in Reception ({waitingMembers.length})
                </h3>
              </div>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <AnimatePresence>
                  {waitingMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MemberCard member={member} status="waiting" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Space>
            </div>
          )}

          {/* Footer Info */}
          <Card size="small" className="bg-blue-50 border-blue-200">
            <Space>
              <InfoCircleOutlined className="text-blue-500" />
              <span className="text-sm text-gray-600">Auto-refreshes every 30 seconds</span>
            </Space>
          </Card>
        </Space>
      )}
    </Modal>
  );
}

function MemberCard({ member, status }: { member: Member; status: 'in-interview' | 'waiting' }) {
  const isInInterview = status === 'in-interview';

  return (
    <Card
      size="small"
      className={`transition-all hover:shadow-lg ${
        isInInterview
          ? 'border-2 border-yellow-300 bg-yellow-50'
          : 'border-2 border-blue-200 bg-blue-50'
      }`}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Header with Name and Committee */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Space>
            <UserOutlined className={isInInterview ? 'text-yellow-600' : 'text-blue-600'} />
            <span className="text-lg font-semibold text-gray-900">{member.fullName}</span>
          </Space>
          <Tag color={isInInterview ? 'gold' : 'blue'} icon={<TeamOutlined />}>
            {member.trackApplying}
          </Tag>
        </div>

        {/* Member Details */}
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space className="text-sm text-gray-600">
            <IdcardOutlined />
            <span className="font-mono font-medium">{member.id}</span>
          </Space>

          {member.interviewTime && (
            <Space className="text-sm text-gray-600">
              <ClockCircleOutlined />
              <span>{member.interviewTime}</span>
            </Space>
          )}

          {member.phoneNumber && (
            <Space className="text-sm text-gray-600">
              <PhoneOutlined />
              <span>{member.phoneNumber}</span>
            </Space>
          )}
        </Space>
      </Space>
    </Card>
  );
}
