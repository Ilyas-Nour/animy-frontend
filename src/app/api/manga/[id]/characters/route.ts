export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    // 1. Try Backend characters first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_URL}/manga/${id}/characters`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const json = await response.json();
            const list = json.data || (Array.isArray(json) ? json : []);
            if (Array.isArray(list) && list.length > 0 && list.some((c: any) => c?.character?.name || c?.name)) {
                return NextResponse.json({ data: list }, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                    }
                });
            }
        }
    } catch (e) {
        console.warn(`Backend characters call failed for ${id}, attempting AniList GraphQL fallback...`);
    }

    // 2. Direct AniList GraphQL fallback (returns in ~150ms)
    try {
        const query = `
          query ($id: Int) {
            Media(id: $id, type: MANGA) {
              characters(sort: ROLE, page: 1, perPage: 16) {
                edges {
                  role
                  node {
                    id
                    name {
                      full
                      native
                    }
                    image {
                      large
                      medium
                    }
                  }
                }
              }
            }
          }
        `;
        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { id: numericId } }),
            cache: 'no-store'
        });

        if (res.ok) {
            const json = await res.json();
            const edges = json.data?.Media?.characters?.edges || [];
            if (edges.length > 0) {
                const characters = edges.map((e: any) => ({
                    role: e.role || 'Main',
                    character: {
                        mal_id: e.node?.id,
                        name: e.node?.name?.full || e.node?.name?.native || 'Unknown',
                        images: {
                            jpg: { image_url: e.node?.image?.large || e.node?.image?.medium || '' },
                            webp: { image_url: e.node?.image?.large || e.node?.image?.medium || '' }
                        }
                    }
                }));
                return NextResponse.json({ data: characters }, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                    }
                });
            }
        }
    } catch (graphqlErr) {
        console.error('AniList characters GraphQL fallback failed:', graphqlErr);
    }

    return NextResponse.json({ data: [] }, { status: 200 });
}
