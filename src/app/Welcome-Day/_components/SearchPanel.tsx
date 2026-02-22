// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Table, Tag, Card, Space, Empty } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ToastProvider';

interface Attendee {
  rowIndex?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  committee?: string;
  isEmailSend?: boolean;
  attended?: string;
}

export default function SearchPanel({ season }: { season?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const getAttendanceTag = (attended?: string) => {
    if (attended?.toLowerCase() === 'true') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Attended
        </Tag>
      );
    }
    return (
      <Tag icon={<CloseCircleOutlined />} color="default">
        Not Attended
      </Tag>
    );
  };

  const formatCommittee = (committee?: string) => {
    if (!committee) return '-';
    // Check if it's the "Invited (Only for Who Not in IEEE)" committee
    if (
      committee.toLowerCase().includes('invited') &&
      committee.toLowerCase().includes('not in ieee')
    ) {
      return 'Invited';
    }
    return committee;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 80,
      render: (text: number) => <span className="font-medium">{text || 'N/A'}</span>,
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
      dataIndex: 'committee',
      key: 'committee',
      width: 120,
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <BankOutlined className="text-purple-500" />
          <span>{formatCommittee(text)}</span>
        </Space>
      ),
    },
    {
      title: 'Attendance',
      key: 'attendance',
      width: 120,
      render: (_: unknown, record: Attendee) => getAttendanceTag(record.attended),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Attendee) => (
        <a href={`/Welcome-Day/${season}/member/${record.rowIndex}`}>
          <Button
            type="link"
            icon={<EyeOutlined style={{ color: '#064692' }} />}
            size="small"
            style={{ color: '#064692' }}
          >
            View
          </Button>
        </a>
      ),
    },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/Welcome-Day/attendees/search?q=${encodeURIComponent(searchQuery)}${season ? `&season=${season}` : ''}`
      );

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.attendees);
        showToast(`Found ${data.attendees.length} attendee(s)`, 'success');
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
        <Card className="shadow-lg" style={{ margin: '42px 0' }}>
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
                icon={<SearchOutlined style={{ color: '#fff' }} />}
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
              <Empty description="No attendees found" />
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {searchResults.map((attendee, index) => (
                      <motion.div
                        key={attendee.rowIndex || `search-attendee-${index}-${attendee.email}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          size="small"
                          className="hover:shadow-md transition-shadow"
                          extra={
                            <a href={`/Welcome-Day/${season}/member/${attendee.rowIndex}`}>
                              <Button
                                type="link"
                                icon={<EyeOutlined style={{ color: '#064692' }} />}
                                size="small"
                                style={{ color: '#064692' }}
                              >
                                View
                              </Button>
                            </a>
                          }
                        >
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div className="font-medium text-lg flex items-center gap-2">
                              <UserOutlined className="text-blue-500" />
                              {attendee.fullName}
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">ID:</span>{' '}
                                {attendee.rowIndex || 'N/A'}
                              </div>
                              <div className="flex items-center gap-2">
                                <MailOutlined className="text-gray-400" />
                                {attendee.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <PhoneOutlined className="text-gray-400" />
                                {attendee.phoneNumber}
                              </div>
                              <div className="flex items-center gap-2">
                                <BankOutlined className="text-purple-500" />
                                <span className="font-medium">Committee:</span>{' '}
                                {formatCommittee(attendee.committee)}
                              </div>
                            </div>
                            <Space size="small" wrap>
                              {getAttendanceTag(attendee.attended)}
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
                    rowKey={(record) => record.rowIndex?.toString() || `search-${record.email}`}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} attendees`,
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
