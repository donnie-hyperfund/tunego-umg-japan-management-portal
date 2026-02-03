import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignSites, campaignSiteContent, campaignAssets, cardManifests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateProject } from '@/lib/project-generator';

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

    // Generate project files
    const project = await generateProject(id);

    // Return just the page.tsx content for debugging
    return NextResponse.json({
      pageContent: project.files['src/app/page.tsx'],
      postcssConfig: project.files['postcss.config.mjs'],
      hasPostcssConfig: 'postcss.config.mjs' in project.files,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error generating preview code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview code' },
      { status: 500 }
    );
  }
}
