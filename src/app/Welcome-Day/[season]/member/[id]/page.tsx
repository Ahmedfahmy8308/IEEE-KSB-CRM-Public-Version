// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { VALIDATION_STATUS, PAYMENT_METHODS } from '@/lib/constants';
import { Input, Select, Button, Card, Tag, Space, Typography } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  TeamOutlined,
  HistoryOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  QrcodeOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

type UserRole = 'ChairMan' | 'highboard' | 'board';

interface AttendeeData {
  rowIndex: number;
  timestamp?: string;
  emailAddress: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId?: string;
  isIEEEMember?: string;
  committee?: string;
  paymentMethod?: string;
  paymentScreenshot?: string;
  referenceNumber?: string;
  checked?: string;
  qrCode?: string;
  attended?: string;
  isEmailSend?: boolean;
  note?: string;
  log?: string;
}

export default function AttendeeDetailPage() {
  const params = useParams();
  const season = params.season as string;
  const router = useRouter();
  const { showToast } = useToast();
  const [attendee, setAttendee] = useState<AttendeeData | null>(null);
  const [originalAttendee, setOriginalAttendee] = useState<AttendeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageTitle, setModalImageTitle] = useState('');

  const canEditField = (fieldName: string): boolean => {
    if (!userRole) return false;
    if (userRole === 'ChairMan') return true;

    // Board and highboard can edit these fields
    const limitedEditFields = ['checked', 'attended', 'note'];
    return limitedEditFields.includes(fieldName);
  };

  const canViewSensitiveData = (): boolean => {
    return userRole === 'ChairMan';
  };

  const openImageModal = (src: string, title: string) => {
    setModalImageSrc(src);
    setModalImageTitle(title);
    setShowImageModal(true);
  };

  const getDirectImageUrl = (url: string): string => {
    if (!url) return url;

    if (url.includes('drive.google.com')) {
      let fileId = '';

      const match1 = url.match(/\/file\/d\/([^\/]+)/);
      if (match1) {
        fileId = match1[1];
      }

      const match2 = url.match(/[?&]id=([^&]+)/);
      if (match2) {
        fileId = match2[1];
      }

      if (fileId) {
        const driveUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        return `/api/image-proxy?url=${encodeURIComponent(driveUrl)}`;
      }
    }

    return url;
  };

  const getDirectFileUrl = (url: string): string => {
    if (!url) return url;

    if (url.includes('drive.google.com')) {
      let fileId = '';

      const match1 = url.match(/\/file\/d\/([^\/]+)/);
      if (match1) {
        fileId = match1[1];
      }

      const match2 = url.match(/[?&]id=([^&]+)/);
      if (match2) {
        fileId = match2[1];
      }

      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/view`;
      }
    }

    return url;
  };

  // Simple URL-based PDF check (no network requests)
  const isPdfUrl = (url: string): boolean => {
    if (!url) return false;
    return url.toLowerCase().includes('pdf');
  };

  const fetchUserRole = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }, []);

  const fetchAttendee = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Welcome-Day/attendees/${params.id}?season=${season}`);
      if (res.ok) {
        const data = await res.json();
        setAttendee(data.attendee);
        setOriginalAttendee(data.attendee); // Store original for comparison
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to load attendee data', 'error');
        router.push(`/Welcome-Day/${season}`);
      }
    } catch (error) {
      console.error('Error fetching attendee:', error);
      showToast('Error loading attendee data', 'error');
      router.push(`/Welcome-Day/${season}`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, season, router]);

  useEffect(() => {
    if (params.id) {
      fetchAttendee();
      fetchUserRole();
    }
  }, [params.id, fetchAttendee, fetchUserRole]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (attendee) {
      setAttendee({ ...attendee, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendee || !originalAttendee) return;

    // Only send fields that have actually changed
    const updates: Record<string, string | number | boolean | undefined> = {};
    const protectedFields = ['nationalId', 'paymentScreenshot', 'qrCode', 'rowIndex'];

    (Object.keys(attendee) as Array<keyof AttendeeData>).forEach((key) => {
      // Skip protected fields and fields that haven't changed
      if (protectedFields.includes(key as string)) return;
      if (attendee[key] !== originalAttendee[key]) {
        updates[key as string] = attendee[key];
      }
    });

    // If no fields changed, don't make the request
    if (Object.keys(updates).length === 0) {
      showToast('No changes to save', 'info');
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/Welcome-Day/attendees/${params.id}?season=${season}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        showToast('Attendee updated successfully', 'success');
        setIsEditing(false);
        fetchAttendee();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update attendee', 'error');
      }
    } catch (error) {
      console.error('Error updating attendee:', error);
      showToast('Error updating attendee', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!attendee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Attendee Not Found</h2>
          <button
            onClick={() => router.push(`/Welcome-Day/${season}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-md border-b sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/Welcome-Day/${season}`)}
                type="text"
                className="hover:bg-gray-100"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {attendee.fullName}
                </h1>
                <Space wrap className="mt-1">
                  <Tag color="blue">ID: {attendee.rowIndex}</Tag>
                  {attendee.committee && <Tag color="green">{attendee.committee}</Tag>}
                  {attendee.attended?.toLowerCase() === 'true' && (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Attended
                    </Tag>
                  )}
                </Space>
              </div>
            </div>

            <Space>
              {!isEditing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                  size="large"
                >
                  Edit Attendee
                </Button>
              ) : (
                <>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setIsEditing(false);
                      fetchAttendee();
                    }}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSubmit}
                    loading={saving}
                    size="large"
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
          >
            <Card
              className="shadow-lg hover:shadow-xl transition-shadow"
              title={
                <Space>
                  <UserOutlined className="text-blue-600" />
                  <span className="text-xl font-semibold">Personal Information</span>
                </Space>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    size="large"
                    value={attendee.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={!isEditing || !canEditField('fullName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    size="large"
                    type="email"
                    value={attendee.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing || !canEditField('email')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Form Email</label>
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    size="large"
                    type="email"
                    value={attendee.emailAddress || ''}
                    onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                    disabled={!isEditing || !canEditField('emailAddress')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    size="large"
                    value={attendee.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing || !canEditField('phoneNumber')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IEEE Member
                  </label>
                  <Input
                    prefix={<TeamOutlined className="text-gray-400" />}
                    size="large"
                    value={attendee.isIEEEMember || ''}
                    onChange={(e) => handleInputChange('isIEEEMember', e.target.value)}
                    disabled={!isEditing || !canEditField('isIEEEMember')}
                  />
                </div>
              </div>

              {/* National ID Document - ChairMan Only */}
              {canViewSensitiveData() && attendee.nationalId && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Space>
                      <IdcardOutlined />
                      National ID Document (ChairMan Only)
                    </Space>
                  </label>
                  {isPdfUrl(attendee.nationalId) ? (
                    <div className="flex gap-4 items-center">
                      <div className="w-48 h-32 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                        <svg
                          className="w-16 h-16 text-red-500 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <Text className="text-xs text-gray-500">PDF Document</Text>
                      </div>
                      <div className="flex-1">
                        <Space direction="vertical" size="small">
                          <Button
                            type="primary"
                            icon={<IdcardOutlined />}
                            onClick={() =>
                              window.open(getDirectFileUrl(attendee.nationalId!), '_blank')
                            }
                          >
                            View PDF Document
                          </Button>
                          <Text type="secondary" className="text-xs">
                            Click to open in new tab
                          </Text>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div
                        className="w-48 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-all hover:border-blue-400 hover:shadow-lg"
                        onClick={() =>
                          openImageModal(
                            getDirectImageUrl(attendee.nationalId!),
                            'National ID Document'
                          )
                        }
                      >
                        <img
                          src={getDirectImageUrl(attendee.nationalId)}
                          alt="National ID"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<div class="flex flex-col items-center justify-center text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-1">Click to view</span></div>';
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 flex items-center">
                        <Button
                          type="link"
                          icon={<IdcardOutlined />}
                          onClick={() =>
                            openImageModal(
                              getDirectImageUrl(attendee.nationalId!),
                              'National ID Document'
                            )
                          }
                          className="text-blue-600"
                        >
                          View Full Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Committee & Payment */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card
              className="shadow-lg hover:shadow-xl transition-shadow"
              title={
                <Space>
                  <WalletOutlined className="text-green-600" />
                  <span className="text-xl font-semibold">Committee & Payment</span>
                </Space>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Committee</label>
                  <Input
                    prefix={<TeamOutlined className="text-gray-400" />}
                    size="large"
                    value={attendee.committee || ''}
                    onChange={(e) => handleInputChange('committee', e.target.value)}
                    disabled={!isEditing || !canEditField('committee')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <Select
                    size="large"
                    value={attendee.paymentMethod || ''}
                    onChange={(value) => handleInputChange('paymentMethod', value)}
                    disabled={!isEditing || !canEditField('paymentMethod')}
                    className="w-full"
                  >
                    <Option value={PAYMENT_METHODS.INSTAPAY}>{PAYMENT_METHODS.INSTAPAY}</Option>
                    <Option value={PAYMENT_METHODS.VODAFONE_CASH}>
                      {PAYMENT_METHODS.VODAFONE_CASH}
                    </Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <Input
                    prefix={<FileTextOutlined className="text-gray-400" />}
                    size="large"
                    value={attendee.referenceNumber || ''}
                    onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                    disabled={!isEditing || !canEditField('referenceNumber')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                  <div className="flex gap-4 items-start">
                    {attendee.qrCode ? (
                      <>
                        <div
                          className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-all hover:border-blue-400 hover:shadow-lg p-2"
                          onClick={() =>
                            openImageModal(`/Welcome-Day/qrcode/${attendee.qrCode}.png`, 'QR Code')
                          }
                        >
                          <img
                            src={`/Welcome-Day/qrcode/${attendee.qrCode}.png`}
                            alt="QR Code"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML =
                                  '<div class="flex flex-col items-center justify-center text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg><span class="text-xs mt-1">Not found</span></div>';
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            prefix={<QrcodeOutlined className="text-gray-400" />}
                            size="large"
                            value={attendee.qrCode}
                            disabled
                            className="mb-2"
                          />
                          <Button
                            type="link"
                            icon={<QrcodeOutlined />}
                            onClick={() =>
                              openImageModal(
                                `/Welcome-Day/qrcode/${attendee.qrCode}.png`,
                                'QR Code'
                              )
                            }
                            className="text-blue-600"
                          >
                            View Full QR Code
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Input
                        prefix={<QrcodeOutlined className="text-gray-400" />}
                        size="large"
                        placeholder="No QR Code"
                        disabled
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Screenshot - ChairMan Only */}
              {canViewSensitiveData() && attendee.paymentScreenshot && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Space>
                      <WalletOutlined />
                      Payment Screenshot (ChairMan Only)
                    </Space>
                  </label>
                  {isPdfUrl(attendee.paymentScreenshot) ? (
                    <div className="flex gap-4 items-center">
                      <div className="w-48 h-32 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                        <svg
                          className="w-16 h-16 text-red-500 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <Text className="text-xs text-gray-500">PDF Document</Text>
                      </div>
                      <div className="flex-1">
                        <Space direction="vertical" size="small">
                          <Button
                            type="primary"
                            icon={<WalletOutlined />}
                            onClick={() =>
                              window.open(getDirectFileUrl(attendee.paymentScreenshot!), '_blank')
                            }
                          >
                            View PDF Document
                          </Button>
                          <Text type="secondary" className="text-xs">
                            Click to open in new tab
                          </Text>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div
                        className="w-48 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-all hover:border-blue-400 hover:shadow-lg"
                        onClick={() =>
                          openImageModal(
                            getDirectImageUrl(attendee.paymentScreenshot!),
                            'Payment Screenshot'
                          )
                        }
                      >
                        <img
                          src={getDirectImageUrl(attendee.paymentScreenshot)}
                          alt="Payment Screenshot"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<div class="flex flex-col items-center justify-center text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-1">Click to view</span></div>';
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 flex items-center">
                        <Button
                          type="link"
                          icon={<WalletOutlined />}
                          onClick={() =>
                            openImageModal(
                              getDirectImageUrl(attendee.paymentScreenshot!),
                              'Payment Screenshot'
                            )
                          }
                          className="text-blue-600"
                        >
                          View Full Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Status & Attendance */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card
              className="shadow-lg hover:shadow-xl transition-shadow"
              title={
                <Space>
                  <CheckCircleOutlined className="text-purple-600" />
                  <span className="text-xl font-semibold">Status & Attendance</span>
                </Space>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validation Status
                  </label>
                  <Select
                    size="large"
                    value={attendee.checked || VALIDATION_STATUS.NOT_CHECKED}
                    onChange={(value) => handleInputChange('checked', value)}
                    disabled={!isEditing || !canEditField('checked')}
                    className="w-full"
                  >
                    <Option value={VALIDATION_STATUS.PASSED}>
                      <Tag color="success" icon={<SafetyOutlined />}>
                        Passed
                      </Tag>
                    </Option>
                    <Option value={VALIDATION_STATUS.NOT_CHECKED}>
                      <Tag color="warning" icon={<ClockCircleOutlined />}>
                        Not Checked
                      </Tag>
                    </Option>
                    <Option value={VALIDATION_STATUS.FAILED}>
                      <Tag color="error" icon={<CloseOutlined />}>
                        Failed
                      </Tag>
                    </Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attended</label>
                  <Select
                    size="large"
                    value={attendee.attended || 'false'}
                    onChange={(value) => handleInputChange('attended', value)}
                    disabled={!isEditing || !canEditField('attended')}
                    className="w-full"
                  >
                    <Option value="true">
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Yes
                      </Tag>
                    </Option>
                    <Option value="false">
                      <Tag color="default" icon={<CloseOutlined />}>
                        No
                      </Tag>
                    </Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Sent</label>
                  <div className="mt-2">
                    <Tag
                      color={attendee.isEmailSend ? 'success' : 'error'}
                      icon={attendee.isEmailSend ? <CheckCircleOutlined /> : <CloseOutlined />}
                      className="text-base px-4 py-2"
                    >
                      {attendee.isEmailSend ? 'Yes' : 'No'}
                    </Tag>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <TextArea
                    rows={3}
                    placeholder="Add any notes about this attendee..."
                    value={attendee.note || ''}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    disabled={!isEditing || !canEditField('note')}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Additional Information */}
          {(attendee.timestamp || attendee.log) && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card
                className="shadow-lg hover:shadow-xl transition-shadow"
                title={
                  <Space>
                    <FileTextOutlined className="text-gray-600" />
                    <span className="text-xl font-semibold">Additional Information</span>
                  </Space>
                }
              >
                <Space direction="vertical" size="large" className="w-full">
                  {attendee.timestamp && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Space>
                          <ClockCircleOutlined />
                          Form Submitted
                        </Space>
                      </label>
                      <Card size="small" className="bg-gray-50">
                        <Text>{attendee.timestamp}</Text>
                      </Card>
                    </div>
                  )}

                  {attendee.log && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Space>
                          <HistoryOutlined />
                          Activity Log
                        </Space>
                      </label>
                      <Card size="small" className="bg-gray-50 max-h-96 overflow-y-auto">
                        <Space direction="vertical" size="middle" className="w-full">
                          {attendee.log
                            .split('\n')
                            .filter((line) => line.trim())
                            .map((logEntry, index) => {
                              // Try new format first: timestamp | user | action
                              const parts = logEntry.split(' | ');
                              if (parts.length >= 3) {
                                const timestamp = parts[0];
                                const user = parts[1];
                                const action = parts.slice(2).join(' | ');

                                const date = new Date(timestamp);
                                const formattedDate = date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                });
                                const formattedTime = date.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                });

                                return (
                                  <Card key={index} size="small" className="shadow-sm">
                                    <Space direction="vertical" size="small" className="w-full">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <Space size="small">
                                          <ClockCircleOutlined className="text-blue-600" />
                                          <Text strong className="text-xs">
                                            {formattedDate} at {formattedTime}
                                          </Text>
                                        </Space>
                                        <Tag color="blue" icon={<UserOutlined />}>
                                          {user}
                                        </Tag>
                                      </div>
                                      <Text className="text-sm">{action}</Text>
                                    </Space>
                                  </Card>
                                );
                              }

                              // Try old format: [timestamp] Updated by user (role): fields
                              const oldFormatMatch = logEntry.match(
                                /^\[(.+?)\]\s+Updated by\s+(.+?)\s+\((.+?)\):\s+(.+)$/
                              );
                              if (oldFormatMatch) {
                                const timestamp = oldFormatMatch[1];
                                const user = oldFormatMatch[2];
                                const action = `updated: ${oldFormatMatch[4]}`;

                                const date = new Date(timestamp);
                                const formattedDate = date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                });
                                const formattedTime = date.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                });

                                return (
                                  <Card key={index} size="small" className="shadow-sm">
                                    <Space direction="vertical" size="small" className="w-full">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <Space size="small">
                                          <ClockCircleOutlined className="text-blue-600" />
                                          <Text strong className="text-xs">
                                            {formattedDate} at {formattedTime}
                                          </Text>
                                        </Space>
                                        <Tag color="blue" icon={<UserOutlined />}>
                                          {user}
                                        </Tag>
                                      </div>
                                      <Text className="text-sm">{action}</Text>
                                    </Space>
                                  </Card>
                                );
                              }

                              // Fallback: display as-is
                              return (
                                <Card key={index} size="small" className="shadow-sm">
                                  <Text className="text-sm">{logEntry}</Text>
                                </Card>
                              );
                            })}
                        </Space>
                      </Card>
                    </div>
                  )}
                </Space>
              </Card>
            </motion.div>
          )}
        </form>
      </div>

      {/* Image Modal */}
      {showImageModal && modalImageSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-4xl max-h-full"
          >
            <div className="absolute -top-12 right-0 flex gap-2">
              <Button
                shape="circle"
                icon={<CloseOutlined />}
                onClick={() => setShowImageModal(false)}
                className="bg-white/10 backdrop-blur-sm border-white/20"
                size="large"
              />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-t-xl px-4 py-2 -mb-2">
              <Text className="text-white font-medium">{modalImageTitle}</Text>
            </div>
            <img
              src={modalImageSrc}
              alt={modalImageTitle}
              className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
