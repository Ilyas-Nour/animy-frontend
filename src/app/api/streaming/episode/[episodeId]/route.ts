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

        if (!tmdbId && !malId) {
            return NextResponse.json({ error: 'Missing tmdbId or malId' }, { status: 400 });
        }

        const servers = [];

        if (tmdbId && tmdbId !== 'undefined' && tmdbId !== 'null') {
            servers.push({
                name: 'VidSrc (Multi-Lang)',
                provider: 'vidsrc',
                isNative: false,
                url: `https://vidsrc.to/embed/tv/${tmdbId}/1/${epNumber}`
            });

            servers.push({
                name: 'VidLink (Fast)',
                provider: 'vidlink',
                isNative: false,
                url: `https://vidlink.pro/anime/${tmdbId}/${epNumber}`
            });
            
            servers.push({
                name: 'AutoEmbed (Backup)',
                provider: 'autoembed',
                isNative: false,
                url: `https://autoembed.to/tv/tmdb/${tmdbId}-1-${epNumber}`
            });
        }
        
        // If tmdbId is missing, we use malId with alternative embed providers
        if (malId && malId !== 'undefined' && malId !== 'null') {
             servers.push({
                name: 'AnimeKAI Direct',
                provider: 'animekai',
                isNative: false,
                url: `https://animekai.be/embed/watch/${malId}?ep=${epNumber}`
            });

            try {
                const msRes = await fetch(`https://api.malsync.moe/mal/anime/${malId}`);
                if (msRes.ok) {
                    const msData = await msRes.json();
                    if (msData?.Sites?.Gogoanime) {
                        const gogoKey = Object.keys(msData.Sites.Gogoanime)[0];
                        if (gogoKey) {
                            const gogoUrl = msData.Sites.Gogoanime[gogoKey].url;
                            const identifier = gogoUrl.split('/category/')[1];
                            if (identifier) {
                                servers.push({
                                    name: 'GogoAnime (External)',
                                    provider: 'gogoanime',
                                    isNative: false,
                                    url: `https://gogoanime3.co/${identifier}-episode-${epNumber}`
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('MALSync resolution failed', e);
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
