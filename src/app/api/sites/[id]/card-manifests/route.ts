import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { cardManifests, campaignSites } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    // Get all card manifests for this site
    const manifests = await db
      .select()
      .from(cardManifests)
      .where(eq(cardManifests.siteId, id))
      .orderBy(desc(cardManifests.createdAt));

    return NextResponse.json(manifests);
  } catch (error) {
    console.error('Error fetching card manifests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card manifests' },
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
    const { name, manifest, cardImageUrl, frontImageUrl, backImageUrl, frontMediaType, backMediaType } = body;

    // Validate required fields
    if (!name || !manifest) {
      return NextResponse.json(
        { error: 'Missing required fields: name, manifest' },
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

    // Create card manifest
    const [newManifest] = await db
      .insert(cardManifests)
      .values({
        siteId: id,
        name,
        manifest,
        cardImageUrl: cardImageUrl || null,
        frontImageUrl: frontImageUrl || null,
        backImageUrl: backImageUrl || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newManifest, { status: 201 });
  } catch (error) {
    console.error('Error creating card manifest:', error);
    return NextResponse.json(
      { error: 'Failed to create card manifest' },
      { status: 500 }
    );
  }
}
