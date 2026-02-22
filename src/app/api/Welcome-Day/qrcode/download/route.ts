// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Welcome Day QR Code Download API Route
 * GET /api/Welcome-Day/qrcode/download - Download all QR codes as a ZIP file
 */

import { NextResponse } from 'next/server';
import { withRoles } from '@/lib/middleware';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import AdmZip from 'adm-zip';

export const GET = withRoles(['ChairMan', 'highboard', 'board'], async () => {
  try {
    const qrCodeDir = join(process.cwd(), 'public', 'Welcome-Day', 'qrcode');

    // Read all PNG files in the qrcode directory
    const files = await readdir(qrCodeDir);
    const qrCodeFiles = files.filter((file) => file.endsWith('.png'));

    if (qrCodeFiles.length === 0) {
      return NextResponse.json(
        { error: 'No QR codes found. Please generate QR codes first.' },
        { status: 404 }
      );
    }

    // Create a ZIP archive
    const zip = new AdmZip();

    // Add all QR code files to the archive
    for (const file of qrCodeFiles) {
      const filePath = join(qrCodeDir, file);
      const fileBuffer = await readFile(filePath);
      zip.addFile(file, fileBuffer);
    }

    // Generate ZIP buffer
    const zipBuffer = zip.toBuffer();

    // Return the ZIP file as a download
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="welcome-day-qrcodes.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('QR code download error:', error);
    return NextResponse.json({ error: 'Failed to download QR codes' }, { status: 500 });
  }
});
