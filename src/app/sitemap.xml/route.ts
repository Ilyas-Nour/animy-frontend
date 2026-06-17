export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';
  const currentDate = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (let i = 0; i <= 100; i++) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${baseUrl}/sitemap/${i}.xml</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }
  
  xml += `</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
