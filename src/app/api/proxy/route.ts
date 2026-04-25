import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';
    // Append the target path to the backend URL
    const finalUrl = `${backendUrl}${targetUrl}`;

    console.log(`[PROXY] Fetching: ${finalUrl}`);

    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY ERROR] ${response.status}: ${errorText}`);
      return NextResponse.json(
        { error: 'Backend response failed', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[PROXY CRASH] ${error.message}`);
    return NextResponse.json(
      { error: 'Proxy failed to connect to backend', details: error.message },
      { status: 500 }
    );
  }
}
