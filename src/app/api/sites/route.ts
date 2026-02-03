import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignSites, siteTemplates, campaignSiteContent } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = db.select().from(campaignSites).orderBy(desc(campaignSites.createdAt));

    if (status) {
      query = query.where(eq(campaignSites.status, status)) as any;
    }

    const sites = await query;

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin - only admins can create sites
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to create sites' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, displayName, slug, templateId, status } = body;

    // Validate required fields
    if (!name || !displayName || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, displayName, slug' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingSite = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.slug, slug))
      .limit(1);

    if (existingSite.length > 0) {
      return NextResponse.json(
        { error: 'A site with this slug already exists' },
        { status: 409 }
      );
    }

    // Resolve template ID if provided
    let resolvedTemplateId: string | null = null;
    if (templateId) {
      // Try to find template in database by name
      const [dbTemplate] = await db
        .select()
        .from(siteTemplates)
        .where(eq(siteTemplates.name, templateId))
        .limit(1);

      if (dbTemplate) {
        resolvedTemplateId = dbTemplate.id;
      } else {
        // Template doesn't exist in DB yet, create it
        // First check if template metadata exists in file system
        const templatePath = path.join(process.cwd(), 'src', 'templates', templateId, 'template.json');
        
        if (fs.existsSync(templatePath)) {
          const metadata = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
          const [newTemplate] = await db
            .insert(siteTemplates)
            .values({
              name: templateId,
              description: metadata.description || null,
              templatePath: `templates/${templateId}`,
              isActive: true,
            })
            .returning();
          resolvedTemplateId = newTemplate.id;
        }
      }
    }

    // Get user ID from database (we'll need to look this up or create a helper)
    // For now, we'll store the Clerk userId as a string in createdBy
    // TODO: Create a helper function to get/create user from Clerk userId

    const [newSite] = await db
      .insert(campaignSites)
      .values({
        name,
        displayName,
        slug,
        templateId: resolvedTemplateId,
        status: status || 'draft',
        // createdBy: userId, // TODO: Map Clerk userId to database user ID
      })
      .returning();

    // Create default King & Prince content if template is collectible-campaign
    if (resolvedTemplateId) {
      const [template] = await db
        .select()
        .from(siteTemplates)
        .where(eq(siteTemplates.id, resolvedTemplateId))
        .limit(1);

      if (template && template.name === 'collectible-campaign') {
        const defaultContent = [
          {
            siteId: newSite.id,
            section: 'hero',
            contentType: 'text',
            content: {
              title: '無料の 3D デジタル コレクタブルを手に入れましょう!',
              subtitle: 'King & Princeの音楽と花火がシンクロしたダイナミックエンターテインメント「King & Princeとうちあげ花火2025」。今年はさらにスケールアップし、デビューシングル「シンデレラガール」から8月にリリースされた17thシングル「What We Got ～奇跡は君と～ / I Know」までのKing & Princeのヒット曲に合わせて夜空を埋め尽くす壮大な花火、そして昨年よりもさらに充実のKing & Princeのライブパフォーマンスなど、これまで以上に豪華なエンターテイメントイベントとなっています！',
              backgroundImage: null,
              backgroundVideo: null,
              ctaText: null,
              ctaLink: null,
            },
            order: 0,
            isVisible: true,
          },
          {
            siteId: newSite.id,
            section: 'description',
            contentType: 'richText',
            content: {
              html: '<p>ユニバーサル ミュージック ジャパンが贈る、世界にひとつだけの記念3Dデジタルコレクタブルカードで、一足早くパーティーに参加しよう！重ねて飾れる3Dカードは、お友達とシェアするのに最適なお土産です。</p>',
            },
            order: 1,
            isVisible: true,
          },
        ];

        await db.insert(campaignSiteContent).values(defaultContent);
      }
    }

    return NextResponse.json(newSite, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
