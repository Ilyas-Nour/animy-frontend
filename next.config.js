/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.kitsu.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.alphacoders.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img1.ak.crunchyroll.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images5.alphacoders.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'external-preview.redd.it',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'preview.redd.it',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hklnupqivjxztomdmwsm.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'i.animepahe.si',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    rn[

      ce: '/:path*',
        ers: [

          'X-DNS-Prefetch-Control',
          e: 'on'
          
          
             'Strict-Transport-Security',
          e: 'max-age=63072000; includeSubDomains; preload'
          
          
             'X-Frame-Options',
          e: 'SAMEORIGIN'
          
          
             'X-Content-Type-Options',
          e: 'nosniff'
          
          
             'Referrer-Policy',
          e: 'origin-when-cross-origin'
          
          
             'Permissions-Policy',
          e: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          
        
      
    
  
}

module.exports = nextConfig