import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignAssets } from '@/lib/db/schema';
import { isAdmin } from '@/lib/auth';

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

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id: siteId } = await params;
    const body = await request.json();
    const { url, metadata, filename: bodyFilename, contentType: bodyContentType } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    // Handle both callback format (from Vercel) and direct calls
    let filename: string;
    let contentType: string;

    if (metadata) {
      // Callback format from Vercel Blob
      const parsed = JSON.parse(metadata);
      filename = parsed.filename;
      contentType = parsed.contentType;
    } else {
      // Direct call format
      filename = bodyFilename || url.split('/').pop() || 'unknown';
      contentType = bodyContentType || 'application/octet-stream';
    }

    // Determine file type
    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (contentType?.startsWith('image/')) type = 'image';
    else if (contentType?.startsWith('video/')) type = 'video';
    else if (contentType?.startsWith('audio/')) type = 'audio';

    // Save to database
    const [newAsset] = await db
      .insert(campaignAssets)
      .values({
        siteId,
        type,
        url,
        filename,
        mimeType: contentType,
        size: null, // Size not available from callback
      })
      .returning();

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error('Error saving uploaded asset:', error);
    return NextResponse.json(
      { error: 'Failed to save asset', details: error?.message },
      { status: 500 }
    );
  }
}
