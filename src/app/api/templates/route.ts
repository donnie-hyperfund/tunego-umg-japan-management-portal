import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { siteTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load template metadata from file system
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

// Get all available templates from file system
function getAvailableTemplates() {
  const templatesDir = path.join(process.cwd(), 'src', 'templates');
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return templateDirs.map(templateId => {
    const metadata = loadTemplateMetadata(templateId);
    return {
      id: templateId,
      ...metadata,
      templatePath: `templates/${templateId}`,
    };
  }).filter(t => t !== null);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get templates from database
    const dbTemplates = await db.select().from(siteTemplates).where(eq(siteTemplates.isActive, true));

    // Get templates from file system
    const fsTemplates = getAvailableTemplates();

    // Merge: use database templates if available, otherwise use file system templates
    const templates = dbTemplates.length > 0 
      ? dbTemplates.map(dbTemplate => {
          const fsTemplate = fsTemplates.find(t => t.id === dbTemplate.name);
          return {
            id: dbTemplate.id,
            name: dbTemplate.name,
            description: dbTemplate.description,
            templatePath: dbTemplate.templatePath,
            ...(fsTemplate || {}),
          };
        })
      : fsTemplates;

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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

    const body = await request.json();
    const { name, description, templatePath } = body;

    if (!name || !templatePath) {
      return NextResponse.json(
        { error: 'Missing required fields: name, templatePath' },
        { status: 400 }
      );
    }

    const [newTemplate] = await db
      .insert(siteTemplates)
      .values({
        name,
        description: description || null,
        templatePath,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
