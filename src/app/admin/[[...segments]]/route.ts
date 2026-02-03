import { getPayload } from 'payload';
import config from '@/payload.config';
import { NextRequest } from 'next/server';

const payload = await getPayload({ config });

export const GET = async (request: NextRequest, { params }: { params: Promise<{ segments?: string[] }> }) => {
  const { segments } = await params;
  const path = segments?.join('/') || '';

  return payload.handler(request, { path });
};

export const POST = async (request: NextRequest, { params }: { params: Promise<{ segments?: string[] }> }) => {
  const { segments } = await params;
  const path = segments?.join('/') || '';

  return payload.handler(request, { path });
};
