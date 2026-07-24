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

    // 55-second timeout to allow Hugging Face Spaces cold starts, but finish before Cloudflare's 100s limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      signal: controller.signal,
      redirect: 'manual', // Crucial: Do not follow redirects (like OAuth), forward them to the browser
    };

    // Forward body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if ((targetPath === '/auth/login' || targetPath === '/auth/register') && request.headers.get('content-type')?.includes('application/json')) {
        const jsonBody = await request.json();
        const token = jsonBody['cf-turnstile-response'];
        
        const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET || '',
            response: token || '',
            remoteip: request.headers.get('x-forwarded-for') || '',
          }),
        });
        const result = await r.json();
        if (!result.success) {
          return NextResponse.json({ success: false, message: 'Turnstile verification failed. Please complete the CAPTCHA.' }, { status: 403 });
        }
        
        delete jsonBody['cf-turnstile-response'];
        fetchOptions.body = JSON.stringify(jsonBody);
        headers.delete('content-length');
      } else {
        const bodyBuffer = await request.arrayBuffer();
        if (bodyBuffer.byteLength > 0) {
          fetchOptions.body = bodyBuffer;
        }
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

    // Inject massive-scale Edge Caching for public GET requests
    if (request.method === 'GET' && !request.headers.has('authorization') && response.ok) {
      // Tell Vercel/Cloudflare CDN to cache this for 5 minutes, and serve stale for up to 1 day while fetching fresh in background
      responseHeaders.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    }

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[PROXY TIMEOUT] ${request.method} ${finalUrl} timed out after 55s`);
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
