// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Email Module
 * Handles sending interview invitation emails with Nodemailer
 * Optimized for Gmail with App Password authentication
 * Implements batching and rate limiting to avoid "Invalid login 454-4.7.0" errors
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import type { ApplicantRow } from './sheets';
import { getConfig } from '@/lib/config';

// Environment variables for Gmail configuration (secrets stay in .env)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || true; // SSL/TLS for Gmail
const EMAIL_USER = process.env.SMTP_USER || process.env.EMAIL_USER!; // Gmail address
const EMAIL_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS!; // Gmail App Password
const EMAIL_FROM = process.env.EMAIL_FROM || `IEEE KSB <${EMAIL_USER}>`;

// Batch configuration — read from config.json at call time
function getEmailBatchSize(): number {
  return getConfig().email.batchSize || 21;
}
function getEmailBatchDelay(): number {
  return getConfig().email.batchDelayMs || 2000;
}

/**
 * Create and return a Nodemailer transporter for Gmail
 * Uses App Password authentication with aggressive rate limiting for speed
 */
function getTransporter(): Transporter {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    pool: true, // Use connection pooling for better performance
    maxConnections: 5, // Max concurrent connections (increased for speed)
    maxMessages: 100, // Max messages per connection
    rateDelta: 1000, // Time window for rate limiting (1 second)
    rateLimit: 10, // Max 10 emails per second (aggressive for speed)
  });
}

/**
 * Fill template placeholders with applicant data
 * @param template Email template string with {PLACEHOLDER} syntax
 * @param applicant Applicant data
 * @returns Filled template
 */
export function fillTemplate(template: string, applicant: ApplicantRow): string {
  // Extract first name from full name
  const firstName = applicant.fullName ? applicant.fullName.split(' ')[0] : '';

  return template
    .replace(/{NAME}/g, firstName)
    .replace(/{COMMITTEE}/g, applicant.trackApplying || '')
    .replace(/{DATE}/g, applicant.interviewDay || '')
    .replace(/{TIME}/g, applicant.interviewTime || '')
    .replace(/{ID}/g, applicant.id || '');
}

/**
 * Fill acceptance template placeholders with custom data
 * @param template Email template string with {PLACEHOLDER} syntax
 * @param data Custom data for placeholders
 * @returns Filled template
 */
export function fillAcceptedTemplate(
  template: string,
  data: { name: string; role: string }
): string {
  return template.replace(/{NAME}/g, data.name || '').replace(/{ROLE}/g, data.role || '');
}

/**
 * Send a single email
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email HTML content
 * @returns Success status
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      // cc: 'ahmedfahmy@ieee.org',
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

/**
 * Send interview invitation to a single applicant
 * @param applicant Applicant data
 * @param template Email template with placeholders
 * @param subject Email subject
 * @returns Success status
 */
export async function sendInterviewEmail(
  applicant: ApplicantRow,
  template: string,
  subject: string = 'Interview Invitation - IEEE KSB'
): Promise<boolean> {
  const html = fillTemplate(template, applicant);
  return await sendEmail(applicant.emailAddress, subject, html);
}

/**
 * Send emails in batches with rate limiting
 * Optimized for Gmail with App Password to avoid "Invalid login 454-4.7.0" errors
 * Uses connection pooling and parallel sending within batches
 *
 * @param applicants Array of applicants to send emails to
 * @param template Email template with placeholders
 * @param subject Email subject
 * @param onProgress Optional callback for progress updates
 * @returns Object with success and failure counts
 *
 * @example
 * ```typescript
 * const result = await sendBatchEmails(
 *   applicants,
 *   DEFAULT_INTERVIEW_EMAIL_TEMPLATE,
 *   'Interview Invitation - IEEE KSB'
 * );
 * console.log(`Sent: ${result.success}, Failed: ${result.failed}`);
 * ```
 */
export async function sendBatchEmails(
  applicants: ApplicantRow[],
  template: string,
  subject: string = 'Interview Invitation - IEEE KSB',
  onProgress?: (sent: number, total: number) => void
): Promise<{
  success: number;
  failed: number;
  results: Array<{ id: string; success: boolean; email: string }>;
}> {
  let successCount = 0;
  let failedCount = 0;
  const results: Array<{ id: string; success: boolean; email: string }> = [];

  console.log(`📧 Starting email batch send: ${applicants.length} total emails`);
  const EMAIL_BATCH_SIZE = getEmailBatchSize();
  const EMAIL_BATCH_DELAY_MS = getEmailBatchDelay();
  console.log(
    `⚙️  Configuration: ${EMAIL_BATCH_SIZE} emails per batch, ${EMAIL_BATCH_DELAY_MS / 1000}s delay between batches`
  );

  // Create a single transporter with connection pooling for all batches
  const transporter = getTransporter();

  // Calculate number of batches
  const totalBatches = Math.ceil(applicants.length / EMAIL_BATCH_SIZE);

  try {
    // Process in batches
    for (let i = 0; i < applicants.length; i += EMAIL_BATCH_SIZE) {
      const batch = applicants.slice(i, i + EMAIL_BATCH_SIZE);
      const currentBatchNumber = Math.floor(i / EMAIL_BATCH_SIZE) + 1;

      console.log(
        `\n📦 Batch ${currentBatchNumber}/${totalBatches}: Processing ${batch.length} emails...`
      );

      // Send all emails in current batch in parallel for speed
      // Connection pooling ensures we don't overwhelm Gmail
      const batchPromises = batch.map(async (applicant) => {
        try {
          const html = fillTemplate(template, applicant);

          await transporter.sendMail({
            from: EMAIL_FROM,
            to: applicant.emailAddress,
            // cc: 'ahmedfahmy@ieee.org',
            subject,
            html,
          });

          return {
            id: applicant.id || '',
            success: true,
            email: applicant.emailAddress,
          };
        } catch (error) {
          console.error(
            `   ❌ Failed: ${applicant.emailAddress} -`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          return {
            id: applicant.id || '',
            success: false,
            email: applicant.emailAddress,
          };
        }
      });

      // Wait for all emails in this batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Count successes and failures
      let batchSuccess = 0;
      let batchFailed = 0;
      for (const result of batchResults) {
        if (result.success) {
          successCount++;
          batchSuccess++;
        } else {
          failedCount++;
          batchFailed++;
        }
        results.push(result);
      }

      console.log(
        `   ✅ Batch ${currentBatchNumber} complete: ${batchSuccess} sent, ${batchFailed} failed`
      );

      // Report progress
      if (onProgress) {
        onProgress(successCount + failedCount, applicants.length);
      }

      // Wait before next batch (except for the last batch)
      if (i + EMAIL_BATCH_SIZE < applicants.length) {
        console.log(`   ⏳ Waiting ${EMAIL_BATCH_DELAY_MS / 1000}s before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, EMAIL_BATCH_DELAY_MS));
      }
    }
  } finally {
    // Always close the transporter connection pool
    transporter.close();
    console.log('\n🔌 Connection pool closed');
  }

  console.log(`\n✨ Email sending complete!`);
  console.log(`   📊 Total: ${applicants.length} emails`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📈 Success rate: ${((successCount / applicants.length) * 100).toFixed(1)}%`);

  return { success: successCount, failed: failedCount, results };
}

/**
 * Send emails to an array of recipients in batches
 * Alternative function signature for flexibility - Compatible with NestJS services
 *
 * @param recipients Array of email recipients with their data
 * @param template Email template with placeholders
 * @param subject Email subject line
 * @param onProgress Optional progress callback
 * @returns Promise with send results
 *
 * @example
 * ```typescript
 * // Basic usage
 * const recipients = [
 *   { email: 'user1@example.com', fullName: 'John Doe', id: '1', ... },
 *   { email: 'user2@example.com', fullName: 'Jane Smith', id: '2', ... },
 * ];
 *
 * const result = await sendEmailsInBatches(recipients, template, 'Subject');
 * console.log(`Success: ${result.success}, Failed: ${result.failed}`);
 *
 * // With progress tracking
 * const result = await sendEmailsInBatches(
 *   recipients,
 *   template,
 *   'Subject',
 *   (sent, total) => console.log(`Progress: ${sent}/${total}`)
 * );
 * ```
 */
export async function sendEmailsInBatches(
  recipients: ApplicantRow[],
  template: string,
  subject: string,
  onProgress?: (sent: number, total: number) => void
): Promise<{
  success: number;
  failed: number;
  results: Array<{ id: string; success: boolean; email: string }>;
}> {
  return sendBatchEmails(recipients, template, subject, onProgress);
}

/**
 * Load email template from file
 * @param templateName Template filename (without extension)
 * @returns Template content as string
 */
function loadTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);

  try {
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    // Fallback to basic template
    return `
      <html>
        <body>
          <p>Dear {NAME},</p>
          <p>Interview Details:</p>
          <p>Date: {DATE}</p>
          <p>Time: {TIME}</p>
          <p>ID: {ID}</p>
          <p>Committee: {COMMITTEE}</p>
        </body>
      </html>
    `;
  }
}

/**
 * Default email template for interview invitations (loaded from file)
 */
export const DEFAULT_INTERVIEW_EMAIL_TEMPLATE = loadTemplate('interview_invitation');

/**
 * Default email template for Welcome Day confirmations (loaded from file)
 */
export const DEFAULT_WELCOME_DAY_EMAIL_TEMPLATE = loadTemplate('welcome_day_confirmation');

/**
 * Fill Welcome Day template placeholders with attendee data
 * @param template Email template string with {PLACEHOLDER} syntax
 * @param attendee Attendee data
 * @returns Filled template
 */
export function fillWelcomeDayTemplate(
  template: string,
  attendee: {
    fullName: string;
    committee?: string;
    qrCode?: string;
  }
): string {
  // Extract first name from full name
  const firstName = attendee.fullName ? attendee.fullName.split(' ')[0] : '';

  return template
    .replace(/{FIRST_NAME}/g, firstName)
    .replace(/{NAME}/g, firstName)
    .replace(/{COMMITTEE}/g, attendee.committee || 'N/A')
    .replace(/{TICKET_ID}/g, attendee.qrCode || 'N/A')
    .replace(/{QR_CODE}/g, attendee.qrCode || 'N/A');
}

// Shared transporter instance for Welcome Day emails to avoid creating multiple connections
let welcomeDayTransporter: Transporter | null = null;

/**
 * Get or create a shared transporter for Welcome Day emails
 * Reuses the same connection pool across multiple email sends
 */
function getWelcomeDayTransporter(): Transporter {
  if (!welcomeDayTransporter) {
    welcomeDayTransporter = getTransporter();
  }
  return welcomeDayTransporter;
}

/**
 * Close the Welcome Day transporter connection pool
 * Call this after batch sending is complete
 */
export function closeWelcomeDayTransporter(): void {
  if (welcomeDayTransporter) {
    welcomeDayTransporter.close();
    welcomeDayTransporter = null;
    console.log('🔌 Welcome Day transporter connection pool closed');
  }
}

/**
 * Send Welcome Day email with attached QR code image
 * Uses a shared transporter instance for better performance in batch sends
 * @param to Recipient email address
 * @param subject Email subject
 * @param template Email template
 * @param attendee Attendee data
 * @returns Success status
 */
export async function sendWelcomeDayEmail(
  to: string,
  subject: string,
  template: string,
  attendee: {
    fullName: string;
    committee?: string;
    qrCode?: string;
  }
): Promise<boolean> {
  try {
    const transporter = getWelcomeDayTransporter();
    const html = fillWelcomeDayTemplate(template, attendee);

    // Prepare email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
    };

    // Attach QR code image if it exists
    if (attendee.qrCode) {
      const qrCodePath = path.join(
        process.cwd(),
        'public',
        'Welcome-Day',
        'qrcode',
        `${attendee.qrCode}.png`
      );

      // Check if file exists before attaching
      if (fs.existsSync(qrCodePath)) {
        mailOptions.attachments = [
          {
            filename: `ticket-${attendee.qrCode}.png`,
            path: qrCodePath,
            cid: 'qrcode', // Match the CID in the template (cid:qrcode)
          },
        ];
      } else {
        console.warn(`QR code image not found: ${qrCodePath}`);
        return false; // Don't send email if QR code is missing
      }
    }

    await transporter.sendMail(mailOptions);
    console.log(`   ✅ Welcome Day email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(
      `   ❌ Failed to send to ${to}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}
