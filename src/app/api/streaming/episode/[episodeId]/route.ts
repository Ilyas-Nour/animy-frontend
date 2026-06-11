import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ episodeId: string }> }
) {
    try {
        const { episodeId } = await params;
        const searchParams = request.nextUrl.searchParams;

        // Forward all query params to the backend
        const backendUrl = new URL(`${BACKEND_URL}/streaming/episode/${encodeURIComponent(episodeId)}`);

        // Pass through all relevant params
        const paramsToForward = ['malId', 'ep', 'tmdbId', 'title', 'provider', 'proxyBaseUrl'];
        for (const p of paramsToForward) {
            const v = searchParams.get(p);
            if (v) backendUrl.searchParams.set(p, v);
        }

        // Use the backend's own proxy URL so HLS chunks get proxied correctly
        const protocol = request.nextUrl.protocol;
        const host = request.headers.get('host') || request.nextUrl.host;
        const frontendOrigin = `${protocol}//${host}`;

        // Tell backend to use our own frontend proxy path for HLS rewriting
        // (backend proxy endpoint: /api/v1/streaming/proxy)
        backendUrl.searchParams.set('proxyBaseUrl', `${BACKEND_URL.replace('/api/v1', '')}/api/v1/streaming/proxy`);

        const response = await fetch(backendUrl.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AnimyFrontend/1.0',
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Backend error');
            return NextResponse.json(
                { error: 'Stream fetch failed', detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error: any) {
        console.error('[episode route] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}
