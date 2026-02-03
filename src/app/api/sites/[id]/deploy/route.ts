import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignSites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateProject } from '@/lib/project-generator';
import { isAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin - only admins can deploy
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to deploy sites' },
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

    // Check for Vercel token
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel token not configured. Please set VERCEL_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    // Generate project files
    const project = await generateProject(id);

    // Check if project already exists
    let projectId = site.vercelProjectId;

    // If project exists but name changed, update the Vercel project name
    if (projectId) {
      try {
        // Get current project to check if name needs updating
        const currentProjectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        });

        if (currentProjectResponse.ok) {
          const currentProject = await currentProjectResponse.json();
          // If name changed, update it in Vercel
          if (currentProject.name !== site.name) {
            await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${vercelToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: site.name,
              }),
            });
          }
        }
      } catch (error) {
        console.warn('Failed to update Vercel project name:', error);
        // Continue with deployment even if name update fails
      }
    }

    if (!projectId) {
      // Create new Vercel project using REST API
      try {
        const projectResponse = await fetch('https://api.vercel.com/v9/projects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: site.name,
            framework: 'nextjs',
          }),
        });

        if (!projectResponse.ok) {
          // Project might already exist, try to find it
          const errorData = await projectResponse.json();
          if (projectResponse.status === 409 || errorData.error?.code === 'project_already_exists') {
            // Try to find existing project
            const listResponse = await fetch('https://api.vercel.com/v9/projects', {
              headers: {
                'Authorization': `Bearer ${vercelToken}`,
              },
            });
            
            if (listResponse.ok) {
              const projectsData = await listResponse.json();
              const existingProject = projectsData.projects?.find((p: any) => p.name === site.name);
              if (existingProject) {
                projectId = existingProject.id;
                await db
                  .update(campaignSites)
                  .set({ vercelProjectId: projectId })
                  .where(eq(campaignSites.id, id));
              } else {
                throw new Error('Project creation failed and project not found');
              }
            } else {
              throw new Error('Failed to list projects');
            }
          } else {
            const errorText = await projectResponse.text();
            throw new Error(`Failed to create Vercel project: ${errorText}`);
          }
        } else {
          const projectData = await projectResponse.json();
          projectId = projectData.id;

          // Update site with project ID
          await db
            .update(campaignSites)
            .set({ vercelProjectId: projectId })
            .where(eq(campaignSites.id, id));

          // Set required environment variables in Vercel project
          // Use site-specific Clerk keys if provided, otherwise fall back to global campaign defaults
          // NOTE: We use CAMPAIGN_CLERK_* variables, NOT the management portal's Clerk keys
          const clerkPublishableKey = site.clerkPublishableKey || process.env.CAMPAIGN_CLERK_PUBLISHABLE_KEY;
          const clerkSecretKey = site.clerkSecretKey || process.env.CAMPAIGN_CLERK_SECRET_KEY;

          // Only set Clerk env vars if user management is enabled
          if (site.enableUserManagement && clerkPublishableKey && clerkSecretKey) {
            try {
              // Set environment variables for production
              const envVars = [
                {
                  key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
                  value: clerkPublishableKey,
                  type: 'encrypted',
                  target: ['production', 'preview', 'development'],
                },
                {
                  key: 'CLERK_SECRET_KEY',
                  value: clerkSecretKey,
                  type: 'encrypted',
                  target: ['production', 'preview', 'development'],
                },
              ];

              for (const envVar of envVars) {
                await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${vercelToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(envVar),
                });
              }
            } catch (envError) {
              console.warn('Failed to set environment variables in Vercel:', envError);
              // Don't fail deployment if env vars fail - user can set them manually
            }
          } else {
            console.warn('Clerk keys not found in management portal environment. Please set them manually in Vercel project settings.');
          }
        }
      } catch (error: any) {
        console.error('Error creating Vercel project:', error);
        return NextResponse.json(
          { error: `Failed to create Vercel project: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Prepare files for Vercel API
    // Vercel expects files as an array of objects with 'file' (path) and 'data' (content)
    const files = Object.entries(project.files).map(([filePath, content]) => ({
      file: filePath,
      data: typeof content === 'string' ? content : content.toString('utf-8'),
    }));

    try {
      // Use Vercel REST API to create deployment
      // Vercel API expects files as an array in the request body
      // projectId should be in the URL query parameter, not in the body
      const deploymentResponse = await fetch(
        `https://api.vercel.com/v13/deployments?projectId=${projectId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: site.name,
            files: files,
            projectSettings: {
              framework: 'nextjs',
              buildCommand: 'npm run build',
              devCommand: 'npm run dev',
              installCommand: 'npm install',
            },
            target: 'production', // or 'preview' for draft sites
          }),
        }
      );

      if (!deploymentResponse.ok) {
        const errorData = await deploymentResponse.text();
        console.error('Vercel deployment error:', errorData);
        throw new Error(`Vercel deployment failed: ${deploymentResponse.statusText}`);
      }

      const deploymentData = await deploymentResponse.json();
      const deploymentId = deploymentData.id;
      // Vercel returns url as a string, might be with or without protocol
      const deploymentUrl = deploymentData.url 
        ? (deploymentData.url.startsWith('http') ? deploymentData.url : `https://${deploymentData.url}`)
        : deploymentData.url;

      // Update site with deployment information
      await db
        .update(campaignSites)
        .set({
          vercelDeploymentId: deploymentId,
          vercelDeploymentUrl: deploymentUrl,
          deploymentStatus: 'building',
          lastDeployedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(campaignSites.id, id));

      return NextResponse.json({
        success: true,
        projectId,
        deploymentId,
        deploymentUrl,
        message: 'Deployment initiated successfully! Your site is being built.',
        status: 'building',
      });
    } catch (deploymentError: any) {
      console.error('Error creating deployment:', deploymentError);
      
      // Update site with error status
      await db
        .update(campaignSites)
        .set({
          deploymentStatus: 'error',
          updatedAt: new Date(),
        })
        .where(eq(campaignSites.id, id));

      return NextResponse.json(
        { 
          error: `Failed to create deployment: ${deploymentError.message}`,
          details: 'Check Vercel token permissions and project settings.',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deploying site:', error);
    return NextResponse.json(
      { error: `Failed to deploy site: ${error.message}` },
      { status: 500 }
    );
  }
}
