import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Cloudflare Edge Video Proxy
 * Acts as middleware between the browser and streaming providers
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const referer = searchParams.get('referer');

    if (!targetUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        const urlObj = new URL(targetUrl);
        
        // Prepare headers for the provider
        const headers = new Headers({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Referer': referer || urlObj.origin,
            'Origin': urlObj.origin,
            'Accept': '*/*',
        });

        // Forward Range header for fast seeking
        const range = request.headers.get('range');
        if (range) {
            headers.set('range', range);
        }

        const response = await fetch(targetUrl, {
            headers,
            redirect: 'follow',
        });

        // Handle Manifest Rewriting
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl') || targetUrl.includes('.m3u8')) {
            let manifestText = await response.text();
            const rewrittenManifest = rewriteManifest(manifestText, targetUrl, referer || '');
            
            return new NextResponse(rewrittenManifest, {
                status: response.status,
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600',
                }
            });
        }

        // Pipe Binary Data (TS Segments / MP4)
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        // Clean up headers that Cloudflare might not like forwarding directly
        responseHeaders.delete('content-encoding');
        
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error('[EDGE PROXY ERROR]', error);
        return new NextResponse(`Proxy Error: ${error.message}`, { status: 500 });
    }
}

/**
 * Rewrites URLs in M3U8 to point back to this Cloudflare Edge Proxy
 */
function rewriteManifest(content: string, originalUrl: string, referer: string): string {
    const urlObj = new URL(originalUrl);
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
    const origin = urlObj.origin;
    
    // Point back to THIS proxy
    const proxyPrefix = `/api/streaming/proxy?referer=${encodeURIComponent(referer)}&url=`;

    return content
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();

            if (trimmed.startsWith('#')) {
                // Rewrite URI="url" pattern in tags (e.g. #EXT-X-KEY)
                return line.replace(/URI="([^"]+)"/g, (match, p1) => {
                    const absoluteUrl = resolveUrl(p1, baseUrl, origin);
                    return `URI="${proxyPrefix}${encodeURIComponent(absoluteUrl)}"`;
                });
            }

            if (trimmed === '') return line;

            // It's a segment URL
            const absoluteUrl = resolveUrl(trimmed, baseUrl, origin);
            return `${proxyPrefix}${encodeURIComponent(absoluteUrl)}`;
        })
        .join('\n');
}

function resolveUrl(url: string, baseUrl: string, origin: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${origin}${url}`;
    return `${baseUrl}${url}`;
}
