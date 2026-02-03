// Payload v3 admin routes are handled automatically by Next.js
// This file can be removed if admin UI works without it
// Keeping it for now as a placeholder

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Payload v3 admin UI should be handled automatically
  // If you see this, Payload admin might not be configured correctly
  return NextResponse.json(
    { error: 'Payload admin route not configured. Admin UI should be available at /admin' },
    { status: 404 }
  );
}

export async function POST(request: NextRequest) {
  return GET(request);
}
