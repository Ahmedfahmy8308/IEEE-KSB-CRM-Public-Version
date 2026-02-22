// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day QR Code Generation API Route
 * POST /api/welcome-day/qrcode/generate - Generate QR codes for attendees without them
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import {
  readAllWelcomeDayAttendees,
  batchUpdateWelcomeDayAttendees,
} from '@/lib/sheets/welcomeDay';
import QRCode from 'qrcode';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Generate a unique ticket ID
 */
function generateTicketId(index: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const paddedIndex = index.toString().padStart(4, '0');
  return `WD-${timestamp}-${random}-${paddedIndex}`;
}

/**
 * Generate and save QR code image
 */
async function generateQRCodeImage(ticketId: string): Promise<void> {
  try {
    // Generate QR code as a buffer
    const qrCodeBuffer = await QRCode.toBuffer(ticketId, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
    });

    // Save to public/Welcome-Day/qrcode folder
    const publicPath = join(process.cwd(), 'public', 'Welcome-Day', 'qrcode', `${ticketId}.png`);
    await writeFile(publicPath, qrCodeBuffer);
  } catch (error) {
    console.error(`Failed to generate QR code for ${ticketId}:`, error);
    throw error;
  }
}

export const POST = withRoles(['ChairMan'], async (request: NextRequest) => {
  try {
    const season = request.nextUrl.searchParams.get('season') || undefined;

    const attendees = await readAllWelcomeDayAttendees(season);

    // Find attendees without QR codes
    const attendeesWithoutQR = attendees.filter((a) => !a.qrCode || a.qrCode.trim() === '');

    if (attendeesWithoutQR.length === 0) {
      return NextResponse.json({
        message: 'All attendees already have QR codes',
        generated: 0,
      });
    }

    // Generate unique ticket IDs and QR code images
    const updates = attendeesWithoutQR.map((attendee, index) => ({
      rowIndex: attendee.rowIndex!,
      data: {
        ...attendee,
        qrCode: generateTicketId(index),
      },
    }));

    // Generate QR code images for all tickets
    await Promise.all(updates.map((update) => generateQRCodeImage(update.data.qrCode!)));

    // Batch update the sheet
    await batchUpdateWelcomeDayAttendees(updates, season);

    return NextResponse.json({
      message: 'QR codes generated successfully',
      generated: updates.length,
      ticketIds: updates.map((u) => u.data.qrCode),
      qrCodePath: '/Welcome-Day/qrcode',
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json({ error: 'Failed to generate QR codes' }, { status: 500 });
  }
});
