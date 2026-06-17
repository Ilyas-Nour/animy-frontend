import { MetadataRoute } from 'next'

// We will generate 101 sitemap shards: 
// id: 0 -> Static pages
// id: 1 to 50 -> Anime pages (Pages 1-50 of popular)
// id: 51 to 100 -> Manga pages (Pages 1-50 of top manga)
export async function generateSitemaps() {
    return Array.from({ length: 101 }).map((_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz'
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'
    const currentDate = new Date()

    // Shard 0: Static Pages
    if (id === 0) {
        return [
            { url: baseUrl, lastModified: currentDate, changeFrequency: 'daily', priority: 1.0 },
            { url: `${baseUrl}/anime`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
            { url: `${baseUrl}/manga`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.9 },
            { url: `${baseUrl}/characters`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
            { url: `${baseUrl}/news`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.8 },
            { url: `${baseUrl}/discovery`, lastModified: currentDate, changeFrequency: 'daily', priority: 0.7 },
            { url: `${baseUrl}/movies`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
            { url: `${baseUrl}/series`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
            { url: `${baseUrl}/seasons`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
            { url: `${baseUrl}/blog`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.7 },
            { url: `${baseUrl}/profile/shrine`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.6 },
            { url: `${baseUrl}/auth/login`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${baseUrl}/auth/register`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.3 },
            { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.3 },
            { url: `${baseUrl}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${baseUrl}/guidelines`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
        ]
    }

    // Shards 1-50: Anime Pages
    if (id >= 1 && id <= 50) {
        try {
            const page = id; // page 1 to 50
            const animeRes = await fetch(`${apiUrl}/anime/popular?page=${page}`, { next: { revalidate: 3600 } })
            if (animeRes.ok) {
                const animeData = await animeRes.json()
                const items = Array.isArray(animeData.data)
                    ? animeData.data
                    : (Array.isArray(animeData.data?.data) ? animeData.data.data : [])
                
                return items.map((anime: any) => ({
                    url: `${baseUrl}/anime/${anime.mal_id}`,
                    lastModified: currentDate,
                    changeFrequency: 'weekly',
                    priority: 0.8,
                }))
            }
        } catch (error) {
            console.error(`Sitemap anime shard ${id} failed:`, error)
        }
        return []
    }

    // Shards 51-100: Manga Pages
    if (id >= 51 && id <= 100) {
        try {
            const page = id - 50; // page 1 to 50
            const mangaRes = await fetch(`${apiUrl}/manga/top?filter=bypopularity&page=${page}`, { next: { revalidate: 3600 } })
            if (mangaRes.ok) {
                const mangaData = await mangaRes.json()
                const items = Array.isArray(mangaData.data)
                    ? mangaData.data
                    : (Array.isArray(mangaData.data?.data) ? mangaData.data.data : [])
                
                return items.map((manga: any) => ({
                    url: `${baseUrl}/manga/${manga.mal_id}`,
                    lastModified: currentDate,
                    changeFrequency: 'weekly',
                    priority: 0.8,
                }))
            }
        } catch (error) {
            console.error(`Sitemap manga shard ${id} failed:`, error)
        }
        return []
    }

    return []
}

