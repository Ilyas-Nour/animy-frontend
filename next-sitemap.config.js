/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/server-sitemap.xml', '/admin/*', '/dashboard/*'], // Exclude dynamic server sitemaps and private routes
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz'}/server-sitemap.xml`, // Add Server-Side sitemap here
    ],
  },
}
