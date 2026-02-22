// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Constants and enums used across the application
 */

// Interview Mode Values (S2 only)
export const INTERVIEW_MODE = {
  PHYSICAL: 'Physical',
  ONLINE: 'Online',
} as const;

export type InterviewMode = (typeof INTERVIEW_MODE)[keyof typeof INTERVIEW_MODE];

// Interview State Values
export const INTERVIEW_STATE = {
  NOT_STARTED: 'Not Started',
  NOT_ATTENDED: 'Not Attended',
  WAIT_IN_RECEPTION: 'Wait in Reception',
  IN_INTERVIEW: 'In Interview',
  COMPLETE_INTERVIEW: 'Complete Interview',
} as const;

// Type for interview state
export type InterviewState = (typeof INTERVIEW_STATE)[keyof typeof INTERVIEW_STATE];

// Approval Values
export const APPROVAL_STATUS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending',
} as const;

// Type for approval status
export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

// Welcome Day Payment Methods
export const PAYMENT_METHODS = {
  INSTAPAY: 'Instapay',
  VODAFONE_CASH: 'Vodafone Cash',
} as const;

// Type for payment method
export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// Welcome Day Committees
export const COMMITTEES = {
  HUMAN_RESOURCES: 'Human Resources',
  ORGANIZING_COMMITTEE: 'Organizing Committee',
  GRAPHICS: 'Graphics',
  PUBLIC_RELATIONS: 'Public Relations',
  MARKETING: 'Marketing',
  FRONT_END: 'Front End',
  BACK_END: 'Back End',
  UI_UX: 'UI UX',
  MOBILE_APP: 'Mobile App',
  PROGRAMMING: 'Programming',
  NETWORKING: 'Networking',
  DATA_SCIENCE: 'Data Science',
  MACHINE_LEARNING: 'Machine Learning',
  ROBOTIC: 'Robotic',
  EMBEDDED_SYSTEMS: 'Embedded Systems',
  VIP: 'VIP',
  INVITED: 'Invited (Only for Who Not in IEEE)',
} as const;

// Type for committee
export type Committee = (typeof COMMITTEES)[keyof typeof COMMITTEES];

// Validation status constants
export const VALIDATION_STATUS = {
  PASSED: 'Passed',
  NOT_CHECKED: 'Not Checked',
  FAILED: 'Failed',
} as const;

export type ValidationStatus = (typeof VALIDATION_STATUS)[keyof typeof VALIDATION_STATUS];
