import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ episodeId: string }> }
) {
    try {
        const { episodeId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const tmdbId = searchParams.get('tmdbId');
        const epNumber = searchParams.get('ep') || '1';
        const malId = searchParams.get('malId');
        const title = searchParams.get('title') || '';

        if (!tmdbId && !malId) {
            return NextResponse.json({ error: 'Missing tmdbId or malId' }, { status: 400 });
        }

        const servers = [];

        // ─── MAL-ID Based Embeds (best for anime) ─────────────────────────────
        // These work purely with MAL ID and are reliable iframe embeds for anime
        if (malId && malId !== 'undefined' && malId !== 'null') {
            // vidsrc.me - reliable MAL-ID based anime embed
            servers.push({
                name: 'VidSrc',
                provider: 'vidsrc-me',
                isNative: false,
                url: `https://vidsrc.me/embed/anime?mal=${malId}&ep=${epNumber}`
            });

            // AnimeKai - good MAL-ID based embed
            servers.push({
                name: 'AnimeKai',
                provider: 'animekai',
                isNative: false,
                url: `https://animekai.bz/embed/?mal=${malId}&ep=${epNumber}`
            });

            // 2embed - works with MAL ID for anime
            servers.push({
                name: '2Embed',
                provider: '2embed',
                isNative: false,
                url: `https://www.2embed.skin/embedanime/${malId}/${epNumber}`
            });
        }

        // ─── TMDB-ID Based Embeds (more universal) ─────────────────────────────
        if (tmdbId && tmdbId !== 'undefined' && tmdbId !== 'null') {
            servers.push({
                name: 'EmbedSu',
                provider: 'embedsu',
                isNative: false,
                url: `https://embed.su/embed/tv/${tmdbId}/1/${epNumber}`
            });

            servers.push({
                name: 'VidSrc Pro',
                provider: 'vidsrc-pro',
                isNative: false,
                url: `https://vidsrc.pro/embed/tv/${tmdbId}/1/${epNumber}`
            });

            servers.push({
                name: 'MultiEmbed',
                provider: 'multiembed',
                isNative: false,
                url: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&s=1&e=${epNumber}`
            });
        }

        // ─── MAL-Only fallback embeds ──────────────────────────────────────────
        if (malId && malId !== 'undefined' && malId !== 'null') {
            // GogoAnime via MALSync (async, non-blocking)
            try {
                const msRes = await fetch(`https://api.malsync.moe/mal/anime/${malId}`, {
                    signal: AbortSignal.timeout(3000)
                });
                if (msRes.ok) {
                    const msData = await msRes.json();
                    if (msData?.Sites?.Gogoanime) {
                        const gogoKey = Object.keys(msData.Sites.Gogoanime)[0];
                        if (gogoKey) {
                            const gogoUrl = msData.Sites.Gogoanime[gogoKey].url;
                            const identifier = gogoUrl.split('/category/')[1];
                            if (identifier) {
                                servers.push({
                                    name: 'GogoAnime',
                                    provider: 'gogoanime',
                                    isNative: false,
                                    url: `https://gogoanime3.co/${identifier}-episode-${epNumber}`
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                // MALSync failed — not critical
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                servers
            }
        });

    } catch (error: any) {
        console.error('Watch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to get streaming links' }, { status: 500 });
    }
}
