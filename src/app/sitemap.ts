import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const currentDate = new Date()

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/anime`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/manga`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/characters`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/news`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/discovery`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/auth/login`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/auth/register`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ]

    // Fetch dynamic content
    let animePages: MetadataRoute.Sitemap = []
    let mangaPages: MetadataRoute.Sitemap = []

    try {
        // Fetch top anime
        const animeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/anime/popular?limit=100`, { next: { revalidate: 3600 } })
        if (animeRes.ok) {
            const animeData = await animeRes.json()
            const items = animeData.data || []
            animePages = items.map((anime: any) => ({
                url: `${baseUrl}/anime/${anime.mal_id}`,
                lastModified: currentDate,
                changeFrequency: 'weekly',
                priority: 0.8,
            }))
        }

        // Fetch top manga
        const mangaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/top?filter=bypopularity&limit=100`, { next: { revalidate: 3600 } })
        if (mangaRes.ok) {
            const mangaData = await mangaRes.json()
            const items = mangaData.data || []
            mangaPages = items.map((manga: any) => ({
                url: `${baseUrl}/manga/${manga.mal_id}`,
                lastModified: currentDate,
                changeFrequency: 'weekly',
                priority: 0.8,
            }))
        }
    } catch (error) {
        console.error('Sitemap dynamic generation failed:', error)
    }

    return [...staticPages, ...animePages, ...mangaPages]
}
