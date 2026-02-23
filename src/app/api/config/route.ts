// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Config API Route
 * GET  /api/config - Read current config (ChairMan only)
 * PATCH /api/config - Update config (ChairMan only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRole, withRoles } from '@/lib/middleware';
import { getConfig, updateConfig } from '@/lib/config';

export const GET = withRoles(['ChairMan', 'highboard'], async () => {
  try {
    const config = getConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Config read error:', error);
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
});

export const PATCH = withRole('ChairMan', async (request: NextRequest) => {
  try {
    const body = await request.json();
    const updated = await updateConfig(body);
    return NextResponse.json({ config: updated, message: 'Config updated successfully' });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
});
