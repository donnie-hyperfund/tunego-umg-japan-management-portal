import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaignSites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Vercel Webhook Handler
 * 
 * This endpoint receives webhook events from Vercel when deployments change status.
 * Configure the webhook URL in Vercel project settings:
 * https://vercel.com/docs/observability/webhooks
 * 
 * Webhook events we handle:
 * - deployment.created
 * - deployment.succeeded
 * - deployment.error
 * - deployment.ready
 * - deployment.canceled
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;
    const signature = request.headers.get('x-vercel-signature');
    
    // If webhook secret is configured, verify the signature
    if (webhookSecret && signature) {
      // In production, verify the signature using Vercel's webhook verification
      // For now, we'll skip verification but log a warning
      console.warn('Webhook secret verification not implemented');
    }

    const payload = await request.json();
    const { type, payload: eventPayload } = payload;

    // Handle different webhook event types
    switch (type) {
      case 'deployment.created':
      case 'deployment.building':
        await handleDeploymentBuilding(eventPayload);
        break;
      
      case 'deployment.ready':
      case 'deployment.succeeded':
        await handleDeploymentReady(eventPayload);
        break;
      
      case 'deployment.error':
      case 'deployment.failed':
        await handleDeploymentError(eventPayload);
        break;
      
      case 'deployment.canceled':
        await handleDeploymentCanceled(eventPayload);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing Vercel webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleDeploymentBuilding(payload: any) {
  const { deployment, project } = payload;
  
  if (!deployment || !project) {
    return;
  }

  // Try to find site by deployment ID first (more specific), then by project ID
  let [site] = await db
    .select()
    .from(campaignSites)
    .where(eq(campaignSites.vercelDeploymentId, deployment.id))
    .limit(1);

  // Fallback to project ID if not found by deployment ID
  if (!site) {
    [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.vercelProjectId, project.id))
      .limit(1);
  }

  if (site) {
    await db
      .update(campaignSites)
      .set({
        vercelDeploymentId: deployment.id,
        deploymentStatus: 'building',
        updatedAt: new Date(),
      })
      .where(eq(campaignSites.id, site.id));
  }
}

async function handleDeploymentReady(payload: any) {
  const { deployment, project } = payload;
  
  if (!deployment || !project) {
    return;
  }

  // Try to find site by deployment ID first (more specific), then by project ID
  let [site] = await db
    .select()
    .from(campaignSites)
    .where(eq(campaignSites.vercelDeploymentId, deployment.id))
    .limit(1);

  // Fallback to project ID if not found by deployment ID
  if (!site) {
    [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.vercelProjectId, project.id))
      .limit(1);
  }

  if (site) {
    const deploymentUrl = deployment.url 
      ? (deployment.url.startsWith('http') ? deployment.url : `https://${deployment.url}`)
      : null;

    await db
      .update(campaignSites)
      .set({
        vercelDeploymentId: deployment.id,
        vercelDeploymentUrl: deploymentUrl || site.vercelDeploymentUrl,
        deploymentStatus: 'ready',
        lastDeployedAt: new Date(deployment.createdAt || Date.now()),
        updatedAt: new Date(),
      })
      .where(eq(campaignSites.id, site.id));
  }
}

async function handleDeploymentError(payload: any) {
  const { deployment, project } = payload;
  
  if (!deployment || !project) {
    return;
  }

  // Try to find site by deployment ID first (more specific), then by project ID
  let [site] = await db
    .select()
    .from(campaignSites)
    .where(eq(campaignSites.vercelDeploymentId, deployment.id))
    .limit(1);

  // Fallback to project ID if not found by deployment ID
  if (!site) {
    [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.vercelProjectId, project.id))
      .limit(1);
  }

  if (site) {
    await db
      .update(campaignSites)
      .set({
        vercelDeploymentId: deployment.id,
        deploymentStatus: 'error',
        updatedAt: new Date(),
      })
      .where(eq(campaignSites.id, site.id));
  }
}

async function handleDeploymentCanceled(payload: any) {
  const { deployment, project } = payload;
  
  if (!deployment || !project) {
    return;
  }

  // Try to find site by deployment ID first (more specific), then by project ID
  let [site] = await db
    .select()
    .from(campaignSites)
    .where(eq(campaignSites.vercelDeploymentId, deployment.id))
    .limit(1);

  // Fallback to project ID if not found by deployment ID
  if (!site) {
    [site] = await db
      .select()
      .from(campaignSites)
      .where(eq(campaignSites.vercelProjectId, project.id))
      .limit(1);
  }

  if (site) {
    await db
      .update(campaignSites)
      .set({
        vercelDeploymentId: deployment.id,
        deploymentStatus: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(campaignSites.id, site.id));
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET() {
  return NextResponse.json({ 
    message: 'Vercel webhook endpoint is active',
    endpoint: '/api/webhooks/vercel',
  });
}
