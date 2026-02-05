import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { campaignAssets } from '@/lib/db/schema';
import { campaignSites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { isAdmin } from '@/lib/auth';
import { Readable } from 'stream';
import * as Busboy from 'busboy';

// Use Node.js runtime for file uploads (Edge runtime has limitations with FormData)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Increase max duration for large file uploads (default is 10s, max is 300s)
export const maxDuration = 300;

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

    // Get all assets for this site
    const assets = await db
      .select()
      .from(campaignAssets)
      .where(eq(campaignAssets.siteId, id))
      .orderBy(campaignAssets.uploadedAt);

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching site assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site assets' },
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

    // Check if user is an admin - only admins can upload assets to Vercel Blob
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to upload assets' },
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

    // Check content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { 
          error: 'Invalid content type',
          details: `Expected multipart/form-data, got ${contentType}`
        },
        { status: 400 }
      );
    }

    // Parse multipart form data using busboy to bypass Next.js body size limits
    // This allows us to handle files larger than 10MB
    let fileBuffer: Buffer | null = null;
    let filename: string | null = null;
    let mimeType: string | null = null;
    let fileSize = 0;
    let type: 'image' | 'video' | 'audio' | 'document' = 'document';

    try {
      // Get the request body as a stream
      const body = request.body;
      if (!body) {
        return NextResponse.json(
          { error: 'No request body' },
          { status: 400 }
        );
      }

      // Convert ReadableStream to Node.js Readable stream
      const nodeStream = Readable.fromWeb(body as any);

      // Parse with busboy
      await new Promise<void>((resolve, reject) => {
        const bb = Busboy.default({ headers: { 'content-type': contentType } });
        
        bb.on('file', (name, file, info) => {
          const { filename: fname, encoding, mimeType: mime } = info;
          filename = fname;
          mimeType = mime as string | null;
          
          const chunks: Buffer[] = [];
          
          file.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            fileSize += chunk.length;
          });
          
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
          });
        });
        
        bb.on('finish', () => {
          resolve();
        });
        
        bb.on('error', (err) => {
          reject(err);
        });
        
        nodeStream.pipe(bb);
      });

      if (!fileBuffer || !filename) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Determine file type - use type assertion since we know file was parsed successfully
      const mimeTypeValue = mimeType as string | null;
      if (mimeTypeValue) {
        if (mimeTypeValue.startsWith('image/')) type = 'image';
        else if (mimeTypeValue.startsWith('video/')) type = 'video';
        else if (mimeTypeValue.startsWith('audio/')) type = 'audio';
      }

    } catch (parseError: any) {
      console.error('FormData parsing error:', parseError);
      console.error('Content-Type:', contentType);
      console.error('Request method:', request.method);
      
      // Check if this is likely a body size limit issue
      const isSizeLimitError = parseError?.message?.includes('Unexpected end of form') || 
                               parseError?.message?.includes('body exceeded');
      
      return NextResponse.json(
        { 
          error: 'Failed to parse FormData',
          details: parseError?.message || 'Unable to parse request body as FormData.',
          suggestion: isSizeLimitError 
            ? 'File is too large for direct upload. Please use the upload-token flow for files larger than 10MB.'
            : 'Please ensure the file is being sent as multipart/form-data.'
        },
        { status: 400 }
      );
    }

    // Check for required environment variable
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    // Check file size (Vercel Blob has a 4.5GB limit, but we'll set a reasonable limit)
    const maxFileSize = 500 * 1024 * 1024; // 500MB
    if (fileSize > maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    // Convert buffer to Blob/File-like object for Vercel Blob
    let blob;
    try {
      // Create a Blob from the buffer - convert Buffer to Uint8Array for compatibility
      const uint8Array = new Uint8Array(fileBuffer);
      const blobData = new Blob([uint8Array], { type: mimeType || 'application/octet-stream' });
      
      blob = await put(`sites/${id}/${filename}`, blobData, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (blobError: any) {
      console.error('Vercel Blob upload error:', blobError);
      return NextResponse.json(
        { 
          error: 'Failed to upload to blob storage',
          details: blobError?.message || 'Unknown blob storage error'
        },
        { status: 500 }
      );
    }

    // Save to database
    let newAsset;
    try {
      [newAsset] = await db
        .insert(campaignAssets)
        .values({
          siteId: id,
          type,
          url: blob.url,
          filename: filename,
          mimeType: mimeType,
          size: fileSize,
          // uploadedBy: userId, // TODO: Map Clerk userId to database user ID
        })
        .returning();
    } catch (dbError: any) {
      console.error('Database insertion error:', dbError);
      // Note: The blob was uploaded but we failed to save the record
      // In production, you might want to delete the blob here
      return NextResponse.json(
        { 
          error: 'Failed to save asset record',
          details: dbError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload asset',
        details: error?.message || 'Unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
