import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { cardManifests, campaignSites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manifestId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, manifestId } = await params;
    const body = await request.json();
    const { name, manifest, cardImageUrl, frontImageUrl, backImageUrl, frontMediaType, backMediaType, isActive } = body;

    // Verify site exists
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Verify manifest exists and belongs to this site
    const [existingManifest] = await db
      .select()
      .from(cardManifests)
      .where(
        and(
          eq(cardManifests.id, manifestId),
          eq(cardManifests.siteId, id)
        )
      )
      .limit(1);

    if (!existingManifest) {
      return NextResponse.json({ error: 'Card manifest not found' }, { status: 404 });
    }

    // Update card manifest
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (manifest !== undefined) updateData.manifest = manifest;
    if (cardImageUrl !== undefined) updateData.cardImageUrl = cardImageUrl || null;
    if (frontImageUrl !== undefined) updateData.frontImageUrl = frontImageUrl || null;
    if (backImageUrl !== undefined) updateData.backImageUrl = backImageUrl || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedManifest] = await db
      .update(cardManifests)
      .set(updateData)
      .where(eq(cardManifests.id, manifestId))
      .returning();

    return NextResponse.json(updatedManifest);
  } catch (error) {
    console.error('Error updating card manifest:', error);
    return NextResponse.json(
      { error: 'Failed to update card manifest' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; manifestId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, manifestId } = await params;

    // Verify site exists
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Verify manifest exists and belongs to this site
    const [existingManifest] = await db
      .select()
      .from(cardManifests)
      .where(
        and(
          eq(cardManifests.id, manifestId),
          eq(cardManifests.siteId, id)
        )
      )
      .limit(1);

    if (!existingManifest) {
      return NextResponse.json({ error: 'Card manifest not found' }, { status: 404 });
    }

    // Delete card manifest
    await db
      .delete(cardManifests)
      .where(eq(cardManifests.id, manifestId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card manifest:', error);
    return NextResponse.json(
      { error: 'Failed to delete card manifest' },
      { status: 500 }
    );
  }
}
