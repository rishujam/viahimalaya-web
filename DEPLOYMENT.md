# ViaHimalaya Website Deployment Guide

## Overview
This guide will help you deploy your Next.js ViaHimalaya website using Vercel and connect it to your Cloudflare domain.

## Prerequisites
- ✅ Next.js website ready (completed)
- ✅ Domain purchased from Cloudflare
- ✅ GitHub account (recommended for deployment)

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Prepare Your Code
1. **Push to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ViaHimalaya website"
   git branch -M main
   git remote add origin https://github.com/yourusername/viahimalaya-web.git
   git push -u origin main
   ```

#### Step 2: Deploy to Vercel
1. **Go to Vercel**: Visit [vercel.com](https://vercel.com)
2. **Sign up/Login**: Use your GitHub account
3. **Import Project**: Click "New Project" → Import from GitHub
4. **Select Repository**: Choose your `viahimalaya-web` repository
5. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
6. **Deploy**: Click "Deploy"

#### Step 3: Connect Custom Domain
1. **In Vercel Dashboard**: Go to your project → Settings → Domains
2. **Add Domain**: Enter your Cloudflare domain (e.g., `viahimalaya.com`)
3. **Get DNS Records**: Vercel will provide DNS records to add

#### Step 4: Configure Cloudflare DNS
1. **Login to Cloudflare**: Go to your domain dashboard
2. **DNS Settings**: Navigate to DNS → Records
3. **Add Records** (provided by Vercel):
   ```
   Type: CNAME
   Name: www
   Content: cname.vercel-dns.com
   
   Type: A
   Name: @
   Content: 76.76.19.61
   ```
4. **Proxy Status**: Set to "Proxied" (orange cloud)

### Option 2: Cloudflare Pages

#### Step 1: Build Configuration
1. **Create build script** in `package.json` (already exists):
   ```json
   {
     "scripts": {
       "build": "next build",
       "export": "next export"
     }
   }
   ```

#### Step 2: Deploy to Cloudflare Pages
1. **Cloudflare Dashboard**: Go to Pages → Create a project
2. **Connect Git**: Link your GitHub repository
3. **Build Settings**:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output directory: `.next`
4. **Deploy**: Click "Save and Deploy"

#### Step 3: Custom Domain (Automatic)
- Your domain will be automatically connected since it's already in Cloudflare

## Environment Configuration

### Update Metadata
Update your site metadata in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "ViaHimalaya - Coming Soon",
  description: "High-precision, guide-verified offline trails for India's most iconic treks. Coming Soon.",
  keywords: "himalaya, trekking, trails, offline maps, india, mountains",
  authors: [{ name: "ViaHimalaya" }],
  openGraph: {
    title: "ViaHimalaya - Coming Soon",
    description: "High-precision, guide-verified offline trails for India's most iconic treks.",
    url: "https://yourdomain.com",
    siteName: "ViaHimalaya",
    images: [
      {
        url: "/bg.jpg",
        width: 2560,
        height: 1440,
        alt: "ViaHimalaya - Himalayan Trails",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViaHimalaya - Coming Soon",
    description: "High-precision, guide-verified offline trails for India's most iconic treks.",
    images: ["/bg.jpg"],
  },
};
```

### Performance Optimizations

#### 1. Add robots.txt
Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

#### 2. Add sitemap.xml
Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com</loc>
    <lastmod>2024-04-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

#### 3. Optimize Images
Your `bg.jpg` should be optimized:
- **Format**: WebP with JPEG fallback
- **Size**: Under 500KB
- **Dimensions**: 2560×1440px (as specified)

## DNS Propagation
- **Time**: 24-48 hours for full global propagation
- **Check Status**: Use tools like `dig yourdomain.com` or online DNS checkers

## SSL Certificate
- **Vercel**: Automatic SSL via Let's Encrypt
- **Cloudflare**: Automatic SSL (already included)

## Post-Deployment Checklist

### Testing
- [ ] Website loads correctly
- [ ] Images display properly
- [ ] Animations work smoothly
- [ ] Mobile responsiveness
- [ ] Join Waitlist button functionality
- [ ] Google Forms integration works

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Test loading speed
- [ ] Verify SEO optimization

### Analytics (Optional)
Add Google Analytics or similar:

1. **Install package**:
   ```bash
   npm install @next/third-parties
   ```

2. **Add to layout.tsx**:
   ```typescript
   import { GoogleAnalytics } from '@next/third-parties/google'
   
   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body>{children}</body>
         <GoogleAnalytics gaId="GA_MEASUREMENT_ID" />
       </html>
     )
   }
   ```

## Troubleshooting

### Common Issues
1. **Build Errors**: Check Next.js version compatibility
2. **Image Loading**: Ensure images are in `public/` folder
3. **Domain Not Working**: Check DNS propagation
4. **SSL Issues**: Wait for certificate generation (up to 24 hours)

### Support Resources
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Cloudflare Docs**: [developers.cloudflare.com](https://developers.cloudflare.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

## Recommended Approach

**For ViaHimalaya, I recommend Vercel because:**
- ✅ Optimized for Next.js
- ✅ Automatic deployments from Git
- ✅ Built-in performance optimizations
- ✅ Easy custom domain setup
- ✅ Excellent developer experience
- ✅ Free tier sufficient for your needs

## Next Steps
1. Choose deployment platform (Vercel recommended)
2. Push code to GitHub if not already done
3. Follow deployment steps above
4. Configure custom domain
5. Test thoroughly
6. Monitor performance and analytics

Your ViaHimalaya website is ready for production deployment!