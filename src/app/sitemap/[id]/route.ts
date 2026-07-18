export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = id.match(/^(\d+)(?:\.xml)?$/);
  if (!match) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const shardId = parseInt(match[1], 10);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';
  const currentDate = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  // Helper to generate a url entry with alternates
  const addUrl = (path: string, changefreq: string, priority: string) => {
    const enUrl = `${baseUrl}${path}`;
    const esUrl = `${baseUrl}/es${path || ''}`;
    const frUrl = `${baseUrl}/fr${path || ''}`;

    xml += `  <url>\n`;
    xml += `    <loc>${enUrl}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="fr" href="${frUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>\n`;
    xml += `  </url>\n`;
  };

  // Shard 0: Static Pages
  if (shardId === 0) {
    const staticPages = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/anime', changefreq: 'daily', priority: '0.9' },
      { path: '/manga', changefreq: 'daily', priority: '0.9' },
      { path: '/characters', changefreq: 'weekly', priority: '0.8' },
      { path: '/news', changefreq: 'daily', priority: '0.8' },
      { path: '/discovery', changefreq: 'daily', priority: '0.7' },
      { path: '/movies', changefreq: 'weekly', priority: '0.8' },
      { path: '/series', changefreq: 'weekly', priority: '0.8' },
      { path: '/seasons', changefreq: 'weekly', priority: '0.8' },
      { path: '/blog', changefreq: 'weekly', priority: '0.7' },
      { path: '/profile/shrine', changefreq: 'weekly', priority: '0.6' },
      { path: '/auth/login', changefreq: 'monthly', priority: '0.5' },
      { path: '/auth/register', changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
      { path: '/terms', changefreq: 'monthly', priority: '0.3' },
      { path: '/contact', changefreq: 'monthly', priority: '0.5' },
      { path: '/guidelines', changefreq: 'monthly', priority: '0.5' },
    ];

    for (const page of staticPages) {
      addUrl(page.path, page.changefreq, page.priority);
    }
  }
  // Shards 1-1000: Anime Pages
  else if (shardId >= 1 && shardId <= 1000) {
    try {
      const page = shardId;
      const animeRes = await fetch(`${apiUrl}/anime/popular?page=${page}`, { next: { revalidate: 3600 } });
      if (animeRes.ok) {
        const animeData = await animeRes.json();
        const items = Array.isArray(animeData.data)
          ? animeData.data
          : (Array.isArray(animeData.data?.data) ? animeData.data.data : []);
        
        for (const anime of items) {
          if (anime && anime.mal_id) {
            addUrl(`/anime/${anime.mal_id}`, 'weekly', '0.8');
          }
        }
      }
    } catch (error) {
      console.error(`Sitemap anime shard ${shardId} failed:`, error);
    }
  }
  // Shards 1001-2000: Manga Pages
  else if (shardId >= 1001 && shardId <= 2000) {
    try {
      const page = shardId - 1000;
      const mangaRes = await fetch(`${apiUrl}/manga/top?filter=bypopularity&page=${page}`, { next: { revalidate: 3600 } });
      if (mangaRes.ok) {
        const mangaData = await mangaRes.json();
        const items = Array.isArray(mangaData.data)
          ? mangaData.data
          : (Array.isArray(mangaData.data?.data) ? mangaData.data.data : []);
        
        for (const manga of items) {
          if (manga && manga.mal_id) {
            addUrl(`/manga/${manga.mal_id}`, 'weekly', '0.8');
          }
        }
      }
    } catch (error) {
      console.error(`Sitemap manga shard ${shardId} failed:`, error);
    }
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
