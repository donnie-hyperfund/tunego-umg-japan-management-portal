import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignSiteContent } from '@/lib/db/schema';
import { campaignSites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Get all content for this site
    const content = await db
      .select()
      .from(campaignSiteContent)
      .where(eq(campaignSiteContent.siteId, id))
      .orderBy(campaignSiteContent.order);

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching site content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site content' },
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

    const { id } = await params;
    const body = await request.json();
    const { section, contentType, content, order, isVisible } = body;

    // Validate required fields
    if (!section || !contentType || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: section, contentType, content' },
        { status: 400 }
      );
    }

    // Verify site exists
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Create content
    const [newContent] = await db
      .insert(campaignSiteContent)
      .values({
        siteId: id,
        section,
        contentType,
        content,
        order: order ?? 0,
        isVisible: isVisible ?? true,
      })
      .returning();

    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    console.error('Error creating site content:', error);
    return NextResponse.json(
      { error: 'Failed to create site content' },
      { status: 500 }
    );
  }
}
