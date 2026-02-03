import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignSiteContent } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, contentId } = await params;
    const body = await request.json();

    // Verify content exists and belongs to site
    const [existingContent] = await db
      .select()
      .from(campaignSiteContent)
      .where(
        and(
          eq(campaignSiteContent.id, contentId),
          eq(campaignSiteContent.siteId, id)
        )
      )
      .limit(1);

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Update content
    const [updatedContent] = await db
      .update(campaignSiteContent)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(campaignSiteContent.id, contentId))
      .returning();

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating site content:', error);
    return NextResponse.json(
      { error: 'Failed to update site content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, contentId } = await params;

    // Verify content exists and belongs to site
    const [existingContent] = await db
      .select()
      .from(campaignSiteContent)
      .where(
        and(
          eq(campaignSiteContent.id, contentId),
          eq(campaignSiteContent.siteId, id)
        )
      )
      .limit(1);

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Delete content
    await db
      .delete(campaignSiteContent)
      .where(eq(campaignSiteContent.id, contentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site content:', error);
    return NextResponse.json(
      { error: 'Failed to delete site content' },
      { status: 500 }
    );
  }
}
