# SEO Production Deployment Guide

## Quick Setup (5 minutes)

### Step 1: Update Environment Variables

Create `.env.production` file:
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Step 2: Copy Generated Images

The following images have been generated in the artifacts folder. Copy them to your public directory:

```bash
# From artifacts folder to public folder
cp og_social_preview.png public/og-image.png
cp pwa_icon_192.png public/icon-192.png
cp pwa_icon_512.png public/icon-512.png
```

### Step 3: Deploy

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Or deploy to your platform
# Vercel: vercel --prod
# Netlify: netlify deploy --prod
```

### Step 4: Post-Deployment (Google Tools)

#### Google Search Console
1. Go to: https://search.google.com/search-console
2. Add property: `https://yourdomain.com`
3. Verify ownership (HTML file method recommended)
4. Submit sitemap: `https://yourdomain.com/sitemap.xml`

#### Google Analytics (Optional)
1. Go to: https://analytics.google.com
2. Create GA4 property
3. Get Measurement ID (G-XXXXXXXXXX)
4. Add to `.env.production`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Step 5: Verify SEO

Test your deployment:
- **Rich Results**: https://search.google.com/test/rich-results
- **Mobile-Friendly**: https://search.google.com/test/mobile-friendly  
- **PageSpeed**: https://pagespeed.web.dev/

## Expected Timeline

- **Week 1**: Pages indexed by Google
- **Month 1**: Brand name rankings, 100+ visitors
- **Month 3**: Long-tail keywords, 500+ visitors
- **Month 6**: Competitive keywords, 1000+ visitors

## Monitoring

Check weekly in Google Search Console:
- Pages indexed
- Search queries
- Click-through rate
- Mobile usability issues

---

**Your anime aggregator is now SEO-optimized and ready for production!** 🚀
