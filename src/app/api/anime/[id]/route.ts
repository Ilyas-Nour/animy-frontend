export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { anilistFetch, mapAniListToAnime } from '@/lib/anilist-client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const query = `
            query($id: Int) {
                Media(id: $id, type: ANIME) {
                    id idMal title { english romaji native } coverImage { extraLarge large medium color }
                    bannerImage format source episodes duration status meanScore popularity description
                    seasonYear season genres trailer { id site }
                    studios(isMain: true) { nodes { id name } }
                    stats { scoreDistribution { score amount } }
                    characters(sort: ROLE, perPage: 10) {
                        edges {
                            role
                            node { id name { full } image { large } }
                            voiceActors(language: JAPANESE) { id name { full } image { large } }
                        }
                    }
                    relations {
                        edges {
                            relationType(version: 2)
                            node { id idMal type status format title { romaji english } coverImage { large } }
                        }
                    }
                    recommendations(perPage: 10, sort: RATING_DESC) {
                        nodes {
                            mediaRecommendation { id title { romaji english } coverImage { large } }
                        }
                    }
                }
            }
        `
        const data = await anilistFetch(query, { id: parseInt(id, 10) })
        const mappedData = mapAniListToAnime(data.Media)
        
        // Populate additional arrays
        mappedData.characters = data.Media?.characters?.edges || []
        mappedData.relations = data.Media?.relations?.edges || []
        mappedData.recommendations = data.Media?.recommendations?.nodes || []

        return NextResponse.json({ success: true, data: { data: mappedData } })
    } catch (error: any) {
        console.error('AniList detail error:', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
