export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

function toBase64Url(str: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64url');
    }
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const titleParam = request.nextUrl.searchParams.get('title');

    // 1. Try Backend chapters with a fast 6s timeout
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(`${API_URL}/manga/${id}/read-chapters`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            const chapters = data.data?.chapters || data.chapters || data.data || [];
            if (Array.isArray(chapters) && chapters.length > 0) {
                return NextResponse.json(
                    { data: { chapters } },
                    {
                        headers: {
                            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                        }
                    }
                );
            }
        }
    } catch (backendErr) {
        console.warn(`Backend chapters failed for manga ${id}, attempting direct fallback...`);
    }

    // 2. Direct Fallback: Resolve title and fetch from MangaPill via Consumet clone
    try {
        let mangaTitle = titleParam;
        if (!mangaTitle) {
            const anilistRes = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: 'query ($id: Int) { Media(id: $id, type: MANGA) { title { english romaji } } }',
                    variables: { id: parseInt(id, 10) }
                })
            });
            if (anilistRes.ok) {
                const alData = await anilistRes.json();
                mangaTitle = alData.data?.Media?.title?.english || alData.data?.Media?.title?.romaji;
            }
        }

        if (mangaTitle) {
            const baseUrl = 'https://consumet-api-clone.vercel.app';
            const searchRes = await fetch(`${baseUrl}/manga/mangapill/${encodeURIComponent(mangaTitle)}`);
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData?.results?.length > 0) {
                    const providerId = searchData.results[0].id;
                    const infoRes = await fetch(`${baseUrl}/manga/mangapill/info?id=${encodeURIComponent(providerId)}`);
                    if (infoRes.ok) {
                        const infoData = await infoRes.json();
                        if (infoData?.chapters?.length > 0) {
                            const chapters = infoData.chapters.map((c: any) => ({
                                id: `mangapill___${toBase64Url(String(c.id))}___${toBase64Url(baseUrl)}`,
                                title: c.title || `Chapter ${c.chapterNumber || c.chapter || c.number || ''}`,
                                chapterNumber: String(c.chapterNumber || c.chapter || c.number || '0'),
                                volumeNumber: String(c.volumeNumber || c.volume || '0'),
                            }));
                            return NextResponse.json(
                                { data: { chapters } },
                                {
                                    headers: {
                                        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                                    }
                                }
                            );
                        }
                    }
                }
            }
        }
    } catch (fallbackErr) {
        console.error('Direct fallback chapters failed:', fallbackErr);
    }

    return NextResponse.json({ data: { chapters: [] } }, { status: 200 });
}
