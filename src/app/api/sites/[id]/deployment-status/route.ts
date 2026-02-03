import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignSites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check deployment status from Vercel API and update database
 * This is a fallback when webhooks aren't working or for manual refresh
 */
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
    const vercelToken = process.env.VERCEL_TOKEN;

    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel token not configured' },
        { status: 500 }
      );
    }

    // Get site from database
    const [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (!site.vercelProjectId) {
      return NextResponse.json({
        status: 'idle',
        message: 'No Vercel project associated with this site',
      });
    }

    // Get latest deployment from Vercel API
    let deploymentStatus = 'idle';
    let deploymentUrl = site.vercelDeploymentUrl;
    let deploymentId = site.vercelDeploymentId;

    try {
      // Get latest deployment for the project
      const deploymentsResponse = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${site.vercelProjectId}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        }
      );

      if (deploymentsResponse.ok) {
        const deploymentsData = await deploymentsResponse.json();
        const latestDeployment = deploymentsData.deployments?.[0];

        if (latestDeployment) {
          deploymentId = latestDeployment.uid;
          
          // Map Vercel deployment state to our status
          // Vercel states: BUILDING, READY, ERROR, CANCELED, QUEUED
          const vercelState = latestDeployment.state?.toLowerCase();
          
          if (vercelState === 'ready') {
            deploymentStatus = 'ready';
            deploymentUrl = latestDeployment.url 
              ? (latestDeployment.url.startsWith('http') 
                  ? latestDeployment.url 
                  : `https://${latestDeployment.url}`)
              : site.vercelDeploymentUrl;
          } else if (vercelState === 'error' || vercelState === 'failed') {
            deploymentStatus = 'error';
          } else if (vercelState === 'canceled') {
            deploymentStatus = 'canceled';
          } else if (vercelState === 'building' || vercelState === 'queued') {
            deploymentStatus = 'building';
          } else {
            deploymentStatus = 'building'; // Default to building for unknown states
          }

          // Update database with latest status
          await db
            .update(campaignSites)
            .set({
              vercelDeploymentId: deploymentId,
              vercelDeploymentUrl: deploymentUrl || site.vercelDeploymentUrl,
              deploymentStatus: deploymentStatus,
              lastDeployedAt: latestDeployment.createdAt 
                ? new Date(latestDeployment.createdAt) 
                : site.lastDeployedAt,
              updatedAt: new Date(),
            })
            .where(eq(campaignSites.id, id));
        }
      }
    } catch (error: any) {
      console.error('Error fetching deployment status from Vercel:', error);
      // Return current database status if Vercel API fails
      return NextResponse.json({
        status: site.deploymentStatus || 'idle',
        deploymentUrl: site.vercelDeploymentUrl,
        error: 'Failed to fetch status from Vercel',
      });
    }

    return NextResponse.json({
      status: deploymentStatus,
      deploymentUrl,
      deploymentId,
      message: `Deployment status: ${deploymentStatus}`,
    });
  } catch (error: any) {
    console.error('Error checking deployment status:', error);
    return NextResponse.json(
      { error: `Failed to check deployment status: ${error.message}` },
      { status: 500 }
    );
  }
}
