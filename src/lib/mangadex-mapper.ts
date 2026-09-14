import { Manga } from '@/types/manga'

export function mapMangaDexToManga(mangadexData: any[]): Manga[] {
    if (!mangadexData || !Array.isArray(mangadexData)) return []

    return mangadexData.map((item: any) => {
        const attrs = item.attributes || {}
        
        // Find cover art
        const coverRel = item.relationships?.find((r: any) => r.type === 'cover_art')
        const coverFileName = coverRel?.attributes?.fileName
        const coverUrl = coverFileName 
            ? `https://uploads.mangadex.org/covers/${item.id}/${coverFileName}.512.jpg`
            : 'https://mangadex.org/favicon.svg' // Fallback

        // MangaDex gives titles as an object with language keys, typically 'en' or 'ja-ro'
        const title = attrs.title?.en || attrs.title?.['ja-ro'] || Object.values(attrs.title || {})[0] || 'Unknown Title'
        const titleEnglish = attrs.altTitles?.find((t: any) => t.en)?.en || undefined
        
        // Status mapping
        let status = 'Unknown'
        if (attrs.status === 'ongoing') status = 'Publishing'
        else if (attrs.status === 'completed') status = 'Finished'
        else if (attrs.status === 'hiatus') status = 'On Hiatus'
        else if (attrs.status === 'cancelled') status = 'Discontinued'

        return {
            id: item.id,
            mal_id: undefined, // MangaDex doesn't natively include MAL ID directly in the main response easily without additional mappings
            url: `https://mangadex.org/title/${item.id}`,
            images: {
                jpg: {
                    image_url: coverUrl,
                    small_image_url: coverUrl.replace('.512.jpg', '.256.jpg'),
                    large_image_url: coverUrl.replace('.512.jpg', '')
                },
                webp: {
                    image_url: coverUrl,
                    small_image_url: coverUrl,
                    large_image_url: coverUrl
                }
            },
            title: title as string,
            title_english: titleEnglish,
            type: attrs.originalLanguage === 'ko' ? 'Manhwa' : attrs.originalLanguage === 'zh' ? 'Manhua' : 'Manga',
            status: status,
            publishing: attrs.status === 'ongoing',
            published: {
                from: attrs.createdAt,
                to: attrs.updatedAt,
                string: String(attrs.year || '')
            },
            synopsis: attrs.description?.en || Object.values(attrs.description || {})[0] || '',
            authors: [],
            serializations: [],
            genres: attrs.tags?.filter((t: any) => t.attributes?.group === 'genre').map((t: any) => ({
                mal_id: 0,
                type: 'manga',
                name: t.attributes?.name?.en,
                url: ''
            })) || [],
            explicit_genres: [],
            themes: attrs.tags?.filter((t: any) => t.attributes?.group === 'theme').map((t: any) => ({
                mal_id: 0,
                type: 'manga',
                name: t.attributes?.name?.en,
                url: ''
            })) || [],
            demographics: attrs.publicationDemographic ? [{
                mal_id: 0,
                type: 'manga',
                name: attrs.publicationDemographic,
                url: ''
            }] : []
        }
    })
}
