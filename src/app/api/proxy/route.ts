import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get('url');

  if (!targetPath) {
    return NextResponse.json({ error: 'Missing target URL parameter' }, { status: 400 });
  }

  // Remove the url param from searchParams to forward the rest
  const forwardedParams = new URLSearchParams(searchParams);
  forwardedParams.delete('url');

  const queryString = forwardedParams.toString();
  const finalUrl = `${BACKEND_URL}${targetPath}${queryString ? `?${queryString}` : ''}`;

  console.log(`[PROXY] ${request.method} ${finalUrl}`);

  try {
    const headers = new Headers(request.headers);
    // Remove host and other potentially problematic headers
    headers.delete('host');
    headers.delete('connection');
    headers.delete('origin');
    headers.delete('referer');
    
    // Ensure we have a clean content-type if not present
    if (!headers.has('content-type') && request.method !== 'GET' && request.method !== 'DELETE') {
      headers.set('content-type', 'application/json');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      signal: controller.signal,
    };

    // Forward body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(finalUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    // Get response body as array buffer to handle various content types (json, binary, etc.)
    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers(response.headers);
    // Remove headers that might cause issues when forwarded
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[PROXY TIMEOUT] ${request.method} ${finalUrl} timed out after 15s`);
      return NextResponse.json(
        { error: 'Backend request timed out', details: 'The server took too long to respond' },
        { status: 504 }
      );
    }
    console.error(`[PROXY CRASH] ${request.method} ${finalUrl}:`, error);
    return NextResponse.json(
      { error: 'Proxy failed to connect to backend', details: error.message },
      { status: 502 }
    );
  }
}
