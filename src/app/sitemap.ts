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

    // TODO: In production, fetch dynamic pages from database
    // Example for when you have database access:
    /*
    try {
      // Fetch popular anime (top 100)
      const animePages = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/anime/popular?limit=100`)
        .then(res => res.json())
        .then(data => data.map((anime: any) => ({
          url: `${baseUrl}/anime/${anime.id}`,
          lastModified: new Date(anime.updatedAt || currentDate),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })))
  
      // Fetch popular manga (top 100)
      const mangaPages = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/popular?limit=100`)
        .then(res => res.json())
        .then(data => data.map((manga: any) => ({
          url: `${baseUrl}/manga/${manga.id}`,
          lastModified: new Date(manga.updatedAt || currentDate),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })))
  
      // Fetch popular characters (top 50)
      const characterPages = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/characters/popular?limit=50`)
        .then(res => res.json())
        .then(data => data.map((character: any) => ({
          url: `${baseUrl}/character/${character.id}`,
          lastModified: new Date(character.updatedAt || currentDate),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        })))
  
      return [...staticPages, ...animePages, ...mangaPages, ...characterPages]
    } catch (error) {
      console.error('Error generating dynamic sitemap:', error)
      return staticPages
    }
    */

    return staticPages
}
