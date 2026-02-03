import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { isAdmin } from '@/lib/auth';

// Use Node.js runtime for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { filename, contentType } = body;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage is not configured' },
        { status: 500 }
      );
    }

    // Generate a client token for direct upload
    const token = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      pathname: `sites/${id}/${filename}`,
      onUploadCompleted: {
        callbackUrl: `${request.nextUrl.origin}/api/sites/${id}/assets/upload-complete`,
        metadata: JSON.stringify({ siteId: id, filename, contentType }),
      },
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Error generating upload token:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload token', details: error?.message },
      { status: 500 }
    );
  }
}
