import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignAssets } from '@/lib/db/schema';
import { campaignSites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { isAdmin } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin - only admins can delete assets from Vercel Blob
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to delete assets' },
        { status: 403 }
      );
    }

    const { id, assetId } = await params;

    // Verify site exists
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get asset and verify it belongs to this site
    const [asset] = await db
      .select()
      .from(campaignAssets)
      .where(
        and(
          eq(campaignAssets.id, assetId),
          eq(campaignAssets.siteId, id)
        )
      )
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete from Vercel Blob storage
    try {
      await del(asset.url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (blobError) {
      // Log error but continue with database deletion
      // The blob might already be deleted or the URL might be invalid
      console.warn('Error deleting blob from Vercel:', blobError);
    }

    // Delete from database
    await db
      .delete(campaignAssets)
      .where(eq(campaignAssets.id, assetId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
