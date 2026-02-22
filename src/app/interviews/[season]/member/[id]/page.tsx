// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { INTERVIEW_STATE } from '@/lib/constants';
import { Input, Select, Button, Card, Avatar, Tag, Space, Typography } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  BookOutlined,
  BankOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  TeamOutlined,
  HistoryOutlined,
  FileTextOutlined,
  HomeOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

type UserRole = 'ChairMan' | 'highboard' | 'board';

interface MemberData {
  id: string;
  timestamp?: string;
  emailAddress?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId?: string;
  age?: string;
  city?: string;
  address?: string;
  personalPhoto?: string;
  faculty?: string;
  department?: string;
  level?: string;
  whatKnowIEEE?: string;
  beenIEEEanBefore?: string;
  ifYesRole?: string;
  trackApplying?: string;
  whyCommittee?: string;
  whyIEEEKSB?: string;
  interviewDay?: string;
  interviewTime?: string;
  state?: string;
  note?: string;
  approved?: string;
  isEmailSend?: boolean;
  isApprovedEmailSend?: boolean;
  log?: string;
  // S2-specific fields
  s1IdEntered?: string;
  idValidationStatus?: string;
  pullSource?: string;
}

export default function MemberDetailPage() {
  const params = useParams();
  const season = params.season as string;
  const router = useRouter();
  const { showToast } = useToast();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeSection, setActiveSection] = useState('personal');

  // Function to handle section navigation with smooth scroll
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);

    // For mobile, just change the section
    if (window.innerWidth < 1024) {
      return;
    }

    // For desktop, scroll to the section
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        const yOffset = -100; // Offset for sticky header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
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

  const canEditField = (fieldName: string): boolean => {
    if (!userRole) return false;

    if (userRole === 'ChairMan') return true;

    const limitedEditFields = ['approved', 'state', 'note'];
    return limitedEditFields.includes(fieldName);
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

  const fetchMember = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/members/${params.id}?season=${season}`);
      if (res.ok) {
        const data = await res.json();
        if (
          !data.member.state ||
          data.member.state === '' ||
          data.member.state === "Didn't attend yet"
        ) {
          data.member.state = INTERVIEW_STATE.NOT_STARTED;
        }
        setMember(data.member);
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to load member data', 'error');
        router.push(`/interviews/${season}`);
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      showToast('Error loading member data', 'error');
      router.push(`/interviews/${season}`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, season, router]);

  useEffect(() => {
    if (params.id) {
      fetchMember();
      fetchUserRole();
    }
  }, [params.id, fetchMember, fetchUserRole]);

  // Intersection Observer to update active section on scroll (desktop only)
  useEffect(() => {
    if (window.innerWidth < 1024) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('section-', '');
          setActiveSection(sectionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sections = [
      'personal',
      'academic',
      'ieee',
      'interview',
      ...(season === 'S2' ? ['s2tracking'] : []),
      'additional',
    ];
    sections.forEach((sectionId) => {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [member, season]);

  const handleInputChange = (field: string, value: string) => {
    if (member) {
      setMember({ ...member, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/interviews/members/${params.id}?season=${season}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: member }),
      });

      if (res.ok) {
        showToast('Member updated successfully', 'success');
        setIsEditing(false);
        fetchMember();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update member', 'error');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      showToast('Error updating member', 'error');
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

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Member Not Found</h2>
          <button
            onClick={() => router.push(`/interviews/${season}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navigationSections = [
    { id: 'personal', label: 'Personal', icon: <UserOutlined /> },
    { id: 'academic', label: 'Academic', icon: <BookOutlined /> },
    { id: 'ieee', label: 'IEEE', icon: <TeamOutlined /> },
    { id: 'interview', label: 'Interview', icon: <CalendarOutlined /> },
    ...(season === 'S2'
      ? [{ id: 's2tracking', label: 'S2 Tracking', icon: <SafetyOutlined /> }]
      : []),
    { id: 'additional', label: 'Additional', icon: <FileTextOutlined /> },
  ];

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
                onClick={() => router.back()}
                type="text"
                className="hover:bg-gray-100"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{member.fullName}</h1>
                <Space wrap className="mt-1">
                  <Tag color="blue">ID: {member.id}</Tag>
                  {member.trackApplying && <Tag color="green">{member.trackApplying}</Tag>}
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
                  Edit Member
                </Button>
              ) : (
                <>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setIsEditing(false);
                      fetchMember();
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

      {/* Mobile Navigation */}
      <div className="sticky top-16 z-40 bg-white border-b sm:hidden shadow-sm">
        <div className="flex overflow-x-auto scrollbar-hide">
          {navigationSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Space>
                {section.icon}
                {section.label}
              </Space>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block lg:w-64 flex-shrink-0"
          >
            <Card className="sticky top-24 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Navigation</h3>
              <Space direction="vertical" className="w-full">
                {navigationSections.map((section) => (
                  <Button
                    key={section.id}
                    type={activeSection === section.id ? 'primary' : 'text'}
                    icon={section.icon}
                    onClick={() => scrollToSection(section.id)}
                    className="w-full justify-start"
                    size="large"
                  >
                    {section.label}
                  </Button>
                ))}
              </Space>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              {(activeSection === 'personal' || window.innerWidth >= 1024) && (
                <motion.div
                  id="section-personal"
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
                      {/* Personal Photo */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Personal Photo
                        </label>
                        {member.personalPhoto ? (
                          <div
                            className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-all hover:border-blue-400 hover:shadow-lg"
                            onClick={() => setShowImageModal(true)}
                          >
                            <img
                              src={getDirectImageUrl(member.personalPhoto)}
                              alt={`${member.fullName}'s photo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML =
                                    '<div class="flex flex-col items-center justify-center text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-1">Failed to load</span></div>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <Avatar size={128} icon={<UserOutlined />} className="shadow-md" />
                        )}
                      </div>

                      <div className="space-y-4 md:col-span-2 lg:col-span-1">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            size="large"
                            value={member.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            disabled={!isEditing || !canEditField('fullName')}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <Input
                              prefix={<MailOutlined className="text-gray-400" />}
                              size="large"
                              type="email"
                              value={member.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              disabled={!isEditing || !canEditField('email')}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Form Email
                            </label>
                            <Input
                              prefix={<MailOutlined className="text-gray-400" />}
                              size="large"
                              type="email"
                              value={member.emailAddress || ''}
                              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                              disabled={!isEditing || !canEditField('emailAddress')}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <Input
                          prefix={<PhoneOutlined className="text-gray-400" />}
                          size="large"
                          value={member.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          disabled={!isEditing || !canEditField('phoneNumber')}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          National ID
                        </label>
                        <Input
                          prefix={<IdcardOutlined className="text-gray-400" />}
                          size="large"
                          value={member.nationalId || ''}
                          onChange={(e) => handleInputChange('nationalId', e.target.value)}
                          disabled={!isEditing || !canEditField('nationalId')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                        <Input
                          prefix={<UserOutlined className="text-gray-400" />}
                          size="large"
                          value={member.age || ''}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          disabled={!isEditing || !canEditField('age')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <Input
                          prefix={<EnvironmentOutlined className="text-gray-400" />}
                          size="large"
                          value={member.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!isEditing || !canEditField('city')}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <Input
                          prefix={<HomeOutlined className="text-gray-400" />}
                          size="large"
                          value={member.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          disabled={!isEditing || !canEditField('address')}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Academic Information */}
              {(activeSection === 'academic' || window.innerWidth >= 1024) && (
                <motion.div
                  id="section-academic"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card
                    className="shadow-lg hover:shadow-xl transition-shadow"
                    title={
                      <Space>
                        <BookOutlined className="text-green-600" />
                        <span className="text-xl font-semibold">Academic Information</span>
                      </Space>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Faculty
                        </label>
                        <Input
                          prefix={<BankOutlined className="text-gray-400" />}
                          size="large"
                          value={member.faculty || ''}
                          onChange={(e) => handleInputChange('faculty', e.target.value)}
                          disabled={!isEditing || !canEditField('faculty')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <Input
                          prefix={<BookOutlined className="text-gray-400" />}
                          size="large"
                          value={member.department || ''}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          disabled={!isEditing || !canEditField('department')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Level
                        </label>
                        <Input
                          prefix={<BookOutlined className="text-gray-400" />}
                          size="large"
                          value={member.level || ''}
                          onChange={(e) => handleInputChange('level', e.target.value)}
                          disabled={!isEditing || !canEditField('level')}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* IEEE Information */}
              {(activeSection === 'ieee' || window.innerWidth >= 1024) && (
                <motion.div
                  id="section-ieee"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card
                    className="shadow-lg hover:shadow-xl transition-shadow"
                    title={
                      <Space>
                        <TeamOutlined className="text-purple-600" />
                        <span className="text-xl font-semibold">IEEE Information</span>
                      </Space>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Committee
                        </label>
                        <Input
                          prefix={<TeamOutlined className="text-gray-400" />}
                          size="large"
                          value={member.trackApplying || ''}
                          onChange={(e) => handleInputChange('trackApplying', e.target.value)}
                          disabled={!isEditing || !canEditField('trackApplying')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Been IEEE Member Before?
                        </label>
                        <Input
                          prefix={<SafetyOutlined className="text-gray-400" />}
                          size="large"
                          value={member.beenIEEEanBefore || ''}
                          onChange={(e) => handleInputChange('beenIEEEanBefore', e.target.value)}
                          disabled={!isEditing || !canEditField('beenIEEEanBefore')}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What do you know about IEEE?
                        </label>
                        <TextArea
                          rows={3}
                          value={member.whatKnowIEEE || ''}
                          onChange={(e) => handleInputChange('whatKnowIEEE', e.target.value)}
                          disabled={!isEditing || !canEditField('whatKnowIEEE')}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Why this Committee?
                        </label>
                        <TextArea
                          rows={3}
                          value={member.whyCommittee || ''}
                          onChange={(e) => handleInputChange('whyCommittee', e.target.value)}
                          disabled={!isEditing || !canEditField('whyCommittee')}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Why IEEE KSB?
                        </label>
                        <TextArea
                          rows={3}
                          value={member.whyIEEEKSB || ''}
                          onChange={(e) => handleInputChange('whyIEEEKSB', e.target.value)}
                          disabled={!isEditing || !canEditField('whyIEEEKSB')}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Interview Information */}
              {(activeSection === 'interview' || window.innerWidth >= 1024) && (
                <motion.div
                  id="section-interview"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card
                    className="shadow-lg hover:shadow-xl transition-shadow"
                    title={
                      <Space>
                        <CalendarOutlined className="text-orange-600" />
                        <span className="text-xl font-semibold">Interview Information</span>
                      </Space>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interview Date
                        </label>
                        <Input
                          prefix={<CalendarOutlined className="text-gray-400" />}
                          size="large"
                          type="date"
                          value={member.interviewDay || ''}
                          onChange={(e) => handleInputChange('interviewDay', e.target.value)}
                          disabled={!isEditing || !canEditField('interviewDay')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interview Time
                        </label>
                        <Input
                          prefix={<ClockCircleOutlined className="text-gray-400" />}
                          size="large"
                          type="time"
                          value={member.interviewTime || ''}
                          onChange={(e) => handleInputChange('interviewTime', e.target.value)}
                          disabled={!isEditing || !canEditField('interviewTime')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interview State
                        </label>
                        <Select
                          size="large"
                          value={member.state || INTERVIEW_STATE.NOT_STARTED}
                          onChange={(value) => handleInputChange('state', value)}
                          disabled={!isEditing || !canEditField('state')}
                          className="w-full"
                        >
                          <Option value={INTERVIEW_STATE.NOT_STARTED}>Not Started</Option>
                          <Option value={INTERVIEW_STATE.NOT_ATTENDED}>
                            {INTERVIEW_STATE.NOT_ATTENDED}
                          </Option>
                          <Option value={INTERVIEW_STATE.WAIT_IN_RECEPTION}>
                            {INTERVIEW_STATE.WAIT_IN_RECEPTION}
                          </Option>
                          <Option value={INTERVIEW_STATE.IN_INTERVIEW}>
                            {INTERVIEW_STATE.IN_INTERVIEW}
                          </Option>
                          <Option value={INTERVIEW_STATE.COMPLETE_INTERVIEW}>
                            {INTERVIEW_STATE.COMPLETE_INTERVIEW}
                          </Option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Approval Status
                        </label>
                        <Select
                          size="large"
                          value={member.approved || 'pending'}
                          onChange={(value) => handleInputChange('approved', value)}
                          disabled={!isEditing || !canEditField('approved')}
                          className="w-full"
                        >
                          <Option value="pending">Pending</Option>
                          <Option value="approved">Approved</Option>
                          <Option value="rejected">Rejected</Option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Sent
                        </label>
                        <div className="mt-2">
                          <Tag
                            color={member.isEmailSend ? 'success' : 'error'}
                            icon={member.isEmailSend ? <CheckCircleOutlined /> : <CloseOutlined />}
                            className="text-base px-4 py-2"
                          >
                            {member.isEmailSend ? 'Yes' : 'No'}
                          </Tag>
                        </div>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <TextArea
                          rows={3}
                          placeholder="Add any notes about this member..."
                          value={member.note || ''}
                          onChange={(e) => handleInputChange('note', e.target.value)}
                          disabled={!isEditing || !canEditField('note')}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* S2 Tracking Information */}
              {season === 'S2' && (activeSection === 's2tracking' || window.innerWidth >= 1024) && (
                <motion.div
                  id="section-s2tracking"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ duration: 0.3, delay: 0.35 }}
                >
                  <Card
                    className="shadow-lg hover:shadow-xl transition-shadow"
                    title={
                      <Space>
                        <SafetyOutlined className="text-indigo-600" />
                        <span className="text-xl font-semibold">S2 Tracking Information</span>
                      </Space>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          S1 ID Entered
                        </label>
                        <Input
                          prefix={<IdcardOutlined className="text-gray-400" />}
                          size="large"
                          value={member.s1IdEntered || ''}
                          onChange={(e) => handleInputChange('s1IdEntered', e.target.value)}
                          disabled={!isEditing || !canEditField('s1IdEntered')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Validation Status
                        </label>
                        {isEditing && canEditField('idValidationStatus') ? (
                          <Select
                            size="large"
                            value={member.idValidationStatus || ''}
                            onChange={(value) => handleInputChange('idValidationStatus', value)}
                            className="w-full"
                          >
                            <Option value="">Not Validated</Option>
                            <Option value="Matched">Matched</Option>
                            <Option value="Wrong ID">Wrong ID</Option>
                            <Option value="Need Review">Need Review</Option>
                          </Select>
                        ) : (
                          <div className="mt-2">
                            {member.idValidationStatus ? (
                              <Tag
                                color={
                                  member.idValidationStatus === 'Matched'
                                    ? 'success'
                                    : member.idValidationStatus === 'Wrong ID'
                                      ? 'error'
                                      : member.idValidationStatus === 'Need Review'
                                        ? 'warning'
                                        : 'default'
                                }
                                icon={
                                  member.idValidationStatus === 'Matched' ? (
                                    <CheckCircleOutlined />
                                  ) : member.idValidationStatus === 'Wrong ID' ? (
                                    <CloseOutlined />
                                  ) : (
                                    <ClockCircleOutlined />
                                  )
                                }
                                className="text-base px-4 py-2"
                              >
                                {member.idValidationStatus}
                              </Tag>
                            ) : (
                              <Tag color="default" className="text-base px-4 py-2">
                                Not Validated
                              </Tag>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pull Source
                        </label>
                        {isEditing && canEditField('pullSource') ? (
                          <Input
                            size="large"
                            value={member.pullSource || ''}
                            onChange={(e) => handleInputChange('pullSource', e.target.value)}
                          />
                        ) : (
                          <div className="mt-2">
                            {member.pullSource ? (
                              <Tag color="blue" className="text-base px-4 py-2">
                                {member.pullSource}
                              </Tag>
                            ) : (
                              <Tag color="default" className="text-base px-4 py-2">
                                Manual
                              </Tag>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Approved Email Sent
                        </label>
                        <div className="mt-2">
                          <Tag
                            color={member.isApprovedEmailSend ? 'success' : 'error'}
                            icon={
                              member.isApprovedEmailSend ? (
                                <CheckCircleOutlined />
                              ) : (
                                <CloseOutlined />
                              )
                            }
                            className="text-base px-4 py-2"
                          >
                            {member.isApprovedEmailSend ? 'Yes' : 'No'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Additional Information */}
              {(activeSection === 'additional' || window.innerWidth >= 1024) &&
                (member.timestamp || member.log) && (
                  <motion.div
                    id="section-additional"
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.3, delay: 0.4 }}
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
                        {member.timestamp && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Space>
                                <ClockCircleOutlined />
                                Form Submitted
                              </Space>
                            </label>
                            <Card size="small" className="bg-gray-50">
                              <Text>{member.timestamp}</Text>
                            </Card>
                          </div>
                        )}

                        {member.log && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              <Space>
                                <HistoryOutlined />
                                Activity Log
                              </Space>
                            </label>
                            <Card size="small" className="bg-gray-50 max-h-96 overflow-y-auto">
                              <Space direction="vertical" size="middle" className="w-full">
                                {member.log
                                  .split('\n')
                                  .filter((line) => line.trim())
                                  .map((logEntry, index) => {
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
                                          <Space
                                            direction="vertical"
                                            size="small"
                                            className="w-full"
                                          >
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
                                    } else {
                                      return (
                                        <Card key={index} size="small" className="shadow-sm">
                                          <Text className="text-sm">{logEntry}</Text>
                                        </Card>
                                      );
                                    }
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
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && member.personalPhoto && (
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
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 bg-white/10 backdrop-blur-sm border-white/20"
              size="large"
            />
            <img
              src={getDirectImageUrl(member.personalPhoto)}
              alt={`${member.fullName}'s photo`}
              className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
