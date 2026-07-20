import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz'

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/_next/static/', '/api/og/'],
                disallow: [
                    '/admin/',
                    '/dashboard/settings',
                    '/private/',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: ['/', '/_next/static/'],
                disallow: ['/admin/', '/dashboard/settings', '/private/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    }
}
