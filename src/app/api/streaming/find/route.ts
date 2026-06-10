import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // We intentionally fail fast to let the StreamingContainer's "Nuclear Fallback" 
    // handle episode generation locally based on malId and totalEpisodes.
    // This provides a much faster and more reliable experience without depending on 
    // flaky external scraping APIs that are often blocked by Cloudflare.
    return NextResponse.json(
        { success: false, error: 'Bypassing discovery to use native direct embed resolution' }, 
        { status: 404 }
    );
}
