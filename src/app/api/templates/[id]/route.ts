import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { siteTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

function loadTemplateMetadata(templateId: string) {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateId, 'template.json');
    if (fs.existsSync(templatePath)) {
      const metadata = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
      return metadata;
    }
    return null;
  } catch (error) {
    console.error(`Error loading template metadata for ${templateId}:`, error);
    return null;
  }
}

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

    // Try to get from database first
    const [dbTemplate] = await db
      .select()
      .from(siteTemplates)
      .where(eq(siteTemplates.id, id))
      .limit(1);

    if (dbTemplate) {
      const metadata = loadTemplateMetadata(dbTemplate.name);
      return NextResponse.json({
        ...dbTemplate,
        ...metadata,
      });
    }

    // Try to get from file system
    const metadata = loadTemplateMetadata(id);
    if (metadata) {
      return NextResponse.json({
        id,
        name: id,
        templatePath: `templates/${id}`,
        ...metadata,
      });
    }

    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
