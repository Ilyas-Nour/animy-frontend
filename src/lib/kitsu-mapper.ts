import { Anime } from '@/types/anime'

export function mapKitsuToAnime(kitsuData: any, included: any[] = []): Anime[] {
    if (!kitsuData || !Array.isArray(kitsuData)) return []

    return kitsuData.map((item: any) => {
        const attrs = item.attributes

        // Find MAL ID from included mappings
        let malId = 0
        let anilistId = 0

        if (item.relationships?.mappings?.data && Array.isArray(item.relationships.mappings.data)) {
            const mappingIds = item.relationships.mappings.data.map((m: any) => m.id)
            const itemMappings = included.filter(i => i.type === 'mappings' && mappingIds.includes(i.id))
            
            const malMapping = itemMappings.find(m => m.attributes?.externalSite === 'myanimelist/anime' || m.attributes?.externalSite === 'myanimelist/manga')
            if (malMapping && malMapping.attributes?.externalId) {
                malId = parseInt(malMapping.attributes.externalId, 10)
            }
            
            const anilistMapping = itemMappings.find(m => m.attributes?.externalSite === 'anilist/anime' || m.attributes?.externalSite === 'anilist/manga')
            if (anilistMapping && anilistMapping.attributes?.externalId) {
                anilistId = parseInt(anilistMapping.attributes.externalId, 10)
            }
        }

        // We MUST have a mal_id for streaming links and detail pages to work properly.
        // If not found in mappings, fallback to the Kitsu ID just so it's a number, 
        // but this usually means streaming embeds might fail if they require MAL/Anilist ID.
        // Fortunately, Kitsu has excellent MAL mapping coverage.
        
        return {
            id: parseInt(item.id, 10),
            mal_id: malId || parseInt(item.id, 10),
            anilistId: anilistId || undefined,
            title: attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || 'Unknown',
            title_english: attrs.titles?.en,
            title_japanese: attrs.titles?.ja_jp,
            images: {
                jpg: {
                    image_url: attrs.posterImage?.small || attrs.posterImage?.original || '',
                    large_image_url: attrs.posterImage?.large || attrs.posterImage?.original || '',
                    small_image_url: attrs.posterImage?.tiny || '',
                }
            },
            bannerImage: attrs.coverImage?.large || attrs.coverImage?.original || undefined,
            score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : undefined, // Kitsu uses 0-100, we use 0-10
            episodes: attrs.episodeCount || undefined,
            status: attrs.status === 'current' ? 'Currently Airing' : attrs.status === 'finished' ? 'Finished Airing' : 'Unknown',
            year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : undefined,
            synopsis: attrs.synopsis || attrs.description || '',
            type: attrs.subtype ? attrs.subtype.toUpperCase() : 'TV',
        }
    })
}
