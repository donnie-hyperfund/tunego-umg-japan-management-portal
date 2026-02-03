import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignAssets } from '@/lib/db/schema';
import { campaignSites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify site exists
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get all assets for this site
    const assets = await db
      .select()
      .from(campaignAssets)
      .where(eq(campaignAssets.siteId, id))
      .orderBy(campaignAssets.uploadedAt);

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching site assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site assets' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin - only admins can upload assets to Vercel Blob
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to upload assets' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify site exists
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type
    const mimeType = file.type;
    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.startsWith('video/')) type = 'video';
    else if (mimeType.startsWith('audio/')) type = 'audio';

    // Upload to Vercel Blob
    const blob = await put(`sites/${id}/${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Save to database
    const [newAsset] = await db
      .insert(campaignAssets)
      .values({
        siteId: id,
        type,
        url: blob.url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        // uploadedBy: userId, // TODO: Map Clerk userId to database user ID
      })
      .returning();

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
