export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';
  const currentDate = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Shard 0 is static pages
  xml += `  <sitemap>\n    <loc>${baseUrl}/sitemap/0.xml</loc>\n    <lastmod>${currentDate}</lastmod>\n  </sitemap>\n`;
  
  // Shards 1-10 for top anime (pages 1-10)
  for (let i = 1; i <= 10; i++) {
    xml += `  <sitemap>\n    <loc>${baseUrl}/sitemap/${i}.xml</loc>\n    <lastmod>${currentDate}</lastmod>\n  </sitemap>\n`;
  }
  
  // Shards 1001-1010 for top manga (pages 1-10)
  for (let i = 1001; i <= 1010; i++) {
    xml += `  <sitemap>\n    <loc>${baseUrl}/sitemap/${i}.xml</loc>\n    <lastmod>${currentDate}</lastmod>\n  </sitemap>\n`;
  }
  
  xml += `</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
