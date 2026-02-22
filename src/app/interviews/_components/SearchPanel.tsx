// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Table, Tag, Card, Space, Empty } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ToastProvider';
import { INTERVIEW_STATE } from '@/lib/constants';

interface Member {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  trackApplying?: string;
  interviewDay?: string;
  interviewTime?: string;
  isEmailSend?: boolean;
  state?: string;
  approved?: string;
}

export default function SearchPanel({ season }: { season?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const getStatusTag = (state: string) => {
    if (state === INTERVIEW_STATE.COMPLETE_INTERVIEW) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {state}
        </Tag>
      );
    } else if (state === INTERVIEW_STATE.IN_INTERVIEW) {
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          {state}
        </Tag>
      );
    }
    return <Tag color="default">{state || INTERVIEW_STATE.NOT_STARTED}</Tag>;
  };

  const getApprovalTag = (approved: string) => {
    if (approved === 'Yes' || approved === 'approved') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Approved
        </Tag>
      );
    } else if (approved === 'No' || approved === 'rejected') {
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Rejected
        </Tag>
      );
    }
    return (
      <Tag icon={<ClockCircleOutlined />} color="warning">
        Pending
      </Tag>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text: string) => <span className="font-medium">{text || 'N/A'}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 180,
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: '#064692' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <MailOutlined className="text-gray-400" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 130,
      render: (text: string) => (
        <Space>
          <PhoneOutlined className="text-gray-400" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Committee',
      dataIndex: 'trackApplying',
      key: 'trackApplying',
      width: 120,
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <BankOutlined className="text-purple-500" />
          <span>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 160,
      render: (_: unknown, record: Member) => (
        <Space direction="vertical" size={4}>
          {getStatusTag(record.state || '')}
          {getApprovalTag(record.approved || '')}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Member) => (
        <Link href={`/interviews/${season}/member/${record.id}`}>
          <Button
            type="link"
            icon={<EyeOutlined style={{ color: '#064692' }} />}
            size="small"
            style={{ color: '#064692' }}
          >
            View
          </Button>
        </Link>
      ),
    },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/interviews/members/search?q=${encodeURIComponent(searchQuery)}${season ? `&season=${season}` : ''}`
      );

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.members);
        showToast(`Found ${data.members.length} member(s)`, 'success');
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error: unknown) {
      console.error('Search error:', error);
      showToast('Search failed. Please try again.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className=" shadow-lg "
          style={{
            margin: '42px 0',
          }}
        >
          <form onSubmit={handleSearch}>
            <Space.Compact style={{ width: '100%' }} size="large">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, email, or phone..."
                prefix={<SearchOutlined className="text-gray-400" />}
                size="large"
                className="flex-1"
              />
              <Button
                htmlType="submit"
                loading={searchLoading}
                icon={<SearchOutlined style={{ color: '#fff' }} />} // أيقونة بيضاء
                size="large"
                style={{
                  backgroundColor: '#064692',
                  borderColor: '#064692',
                  color: '#fff',
                  marginLeft: '20px',
                }}
              >
                Search
              </Button>
            </Space.Compact>
          </form>
        </Card>
      </motion.div>

      {/* Search Results */}
      {searched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-lg">
            {searchResults.length === 0 ? (
              <Empty description="No members found" />
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {searchResults.map((member, index) => (
                      <motion.div
                        key={member.id || `search-member-${index}-${member.email}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          size="small"
                          className="hover:shadow-md transition-shadow"
                          extra={
                            <Link href={`/interviews/${season}/member/${member.id}`}>
                              <Button
                                type="link"
                                icon={<EyeOutlined style={{ color: '#064692' }} />}
                                size="small"
                                style={{ color: '#064692' }}
                              >
                                View
                              </Button>
                            </Link>
                          }
                        >
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div className="font-medium text-lg flex items-center gap-2">
                              <UserOutlined className="text-blue-500" />
                              {member.fullName}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">ID:</span> {member.id || 'N/A'}
                              </div>
                              <div className="flex items-center gap-2">
                                <MailOutlined className="text-gray-400" />
                                {member.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <PhoneOutlined className="text-gray-400" />
                                {member.phoneNumber}
                              </div>
                              <div className="flex items-center gap-2">
                                <BankOutlined className="text-purple-500" />
                                <span className="font-medium">Committee:</span>{' '}
                                {member.trackApplying || '-'}
                              </div>
                            </div>
                            <Space size="small" wrap>
                              {getStatusTag(member.state || '')}
                              {getApprovalTag(member.approved || '')}
                            </Space>
                          </Space>
                        </Card>
                      </motion.div>
                    ))}
                  </Space>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table
                    columns={columns}
                    dataSource={searchResults}
                    rowKey={(record) => record.id || `search-${record.email}`}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} members`,
                    }}
                    scroll={{ x: 900 }}
                    className="ant-table-striped custom-table-header"
                    rowClassName={(_, index) => (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                  />
                </div>
              </>
            )}
          </Card>
        </motion.div>
      )}
      {/* Add style for custom table header color */}
      <style jsx global>{`
        .custom-table-header .ant-table-thead > tr > th {
          background-color: #064692 !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
