// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Interview Schedule Generation Module
 * Generates interview schedules with concurrent slots
 */

import { format, addDays, parse, addMinutes } from 'date-fns';

export interface TimeSlot {
  time: string; // Format: "HH:mm"
  seats: (string | null)[]; // Array of applicant IDs (length = parallelSeats)
}

export interface DaySchedule {
  date: string; // Format: "YYYY-MM-DD"
  dayOfWeek: string; // e.g., "Sunday"
  slots: TimeSlot[];
}

export interface Schedule {
  startDate: string;
  endDate: string;
  days: DaySchedule[];
  totalSlots: number;
  assignedSlots: number;
  parallelSeats: number;
}

/**
 * Generate time slots for a single day
 * @param startTime Start time in HH:mm format (default: "13:00")
 * @param endTime End time in HH:mm format (default: "17:00")
 * @param intervalMinutes Interval between slots in minutes (default: 5)
 * @param parallelSeats Number of concurrent seats per timeslot (default: 2)
 * @returns Array of TimeSlot objects
 */
function generateTimeSlots(
  startTime: string = '13:00',
  endTime: string = '17:00',
  intervalMinutes: number = 5,
  parallelSeats: number = 2
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = '2025-01-01'; // Arbitrary date for parsing

  let currentTime = parse(`${baseDate} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  const end = parse(`${baseDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

  while (currentTime < end) {
    slots.push({
      time: format(currentTime, 'HH:mm'),
      seats: Array(parallelSeats).fill(null),
    });
    currentTime = addMinutes(currentTime, intervalMinutes);
  }

  return slots;
}

/**
 * Check if a date is a valid interview day (Sun-Thu)
 * @param date Date to check
 * @returns True if the day is Sun-Thu
 */
function isValidInterviewDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, 5 = Friday, 6 = Saturday
  return dayOfWeek >= 0 && dayOfWeek <= 4;
}

/**
 * Generate interview schedule for a date range
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @param startTime Start time for interviews (default: "13:00")
 * @param endTime End time for interviews (default: "17:00")
 * @param intervalMinutes Interval between slots in minutes (default: 5)
 * @param parallelSeats Number of concurrent seats per timeslot (default: 2)
 * @returns Schedule object
 */
export function generateSchedule(
  startDate: string,
  endDate: string,
  startTime: string = '13:00',
  endTime: string = '17:00',
  intervalMinutes: number = 5,
  parallelSeats: number = 2
): Schedule {
  const days: DaySchedule[] = [];

  let currentDate = parse(startDate, 'yyyy-MM-dd', new Date());
  const end = parse(endDate, 'yyyy-MM-dd', new Date());

  while (currentDate <= end) {
    // Only include Sun-Thu
    if (isValidInterviewDay(currentDate)) {
      const slots = generateTimeSlots(startTime, endTime, intervalMinutes, parallelSeats);

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        dayOfWeek: format(currentDate, 'EEEE'),
        slots,
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  // Calculate total slots
  const totalSlots = days.reduce((sum, day) => sum + day.slots.length * parallelSeats, 0);

  return {
    startDate,
    endDate,
    days,
    totalSlots,
    assignedSlots: 0,
    parallelSeats,
  };
}

/**
 * Assign applicants to schedule slots
 * @param schedule Schedule object to populate
 * @param applicantIds Array of applicant IDs to assign
 * @returns Updated schedule with assignments
 */
export function assignApplicantsToSchedule(schedule: Schedule, applicantIds: string[]): Schedule {
  let applicantIndex = 0;
  let assignedCount = 0;

  // Iterate through all days and slots
  outerLoop: for (const day of schedule.days) {
    for (const slot of day.slots) {
      for (let s = 0; s < slot.seats.length; s++) {
        if (applicantIndex < applicantIds.length) {
          slot.seats[s] = applicantIds[applicantIndex];
          applicantIndex++;
          assignedCount++;
        } else {
          break outerLoop;
        }
      }
    }
  }

  return {
    ...schedule,
    assignedSlots: assignedCount,
  };
}

/**
 * Get assignment details for a specific applicant
 * @param schedule Schedule object
 * @param applicantId Applicant ID to find
 * @returns Object with date, time, and seat number, or null if not found
 */
export function getApplicantAssignment(
  schedule: Schedule,
  applicantId: string
): { date: string; time: string; seat: number } | null {
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      for (let s = 0; s < slot.seats.length; s++) {
        if (slot.seats[s] === applicantId) {
          return { date: day.date, time: slot.time, seat: s + 1 };
        }
      }
    }
  }
  return null;
}

/**
 * Convert schedule to a list of assignments for updating the sheet
 * @param schedule Schedule object with assignments
 * @returns Array of { id, interviewDay, interviewTime }
 */
export function scheduleToAssignments(schedule: Schedule): Array<{
  id: string;
  interviewDay: string;
  interviewTime: string;
}> {
  const assignments: Array<{ id: string; interviewDay: string; interviewTime: string }> = [];

  for (const day of schedule.days) {
    for (const slot of day.slots) {
      for (const seatId of slot.seats) {
        if (seatId) {
          assignments.push({
            id: seatId,
            interviewDay: day.date,
            interviewTime: slot.time,
          });
        }
      }
    }
  }

  return assignments;
}
