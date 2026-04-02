# ViaHimalaya Hero Background Image Specifications

## Current Implementation Analysis

The home page currently uses an Unsplash image via URL in [`src/app/page.tsx`](src/app/page.tsx:18):
```css
backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
```

The background uses:
- `bg-cover` - scales image to cover entire container
- `bg-center` - centers the image
- `bg-no-repeat` - prevents tiling
- Dark gradient overlay (40-60% opacity)

## Recommended Image Specifications

### Primary Dimensions
**Recommended Size: 2560 × 1440 pixels (16:9 aspect ratio)**

### Rationale:
1. **Desktop Coverage**: Handles up to 2560px wide displays (common ultrawide monitors)
2. **Aspect Ratio**: 16:9 works well across most screen sizes
3. **Responsive Scaling**: Large enough to maintain quality when scaled down
4. **Performance Balance**: Reasonable file size while maintaining quality

### Alternative Sizes by Priority:

#### Option 1: Ultra-High Quality
- **Dimensions**: 3840 × 2160 pixels (4K)
- **Use Case**: Premium experience, future-proofing
- **File Size**: ~800KB - 1.5MB (optimized)

#### Option 2: Balanced (Recommended)
- **Dimensions**: 2560 × 1440 pixels (2K)
- **Use Case**: Best balance of quality and performance
- **File Size**: ~400KB - 800KB (optimized)

#### Option 3: Performance-Focused
- **Dimensions**: 1920 × 1080 pixels (Full HD)
- **Use Case**: Faster loading, mobile-first approach
- **File Size**: ~200KB - 400KB (optimized)

## Device Breakpoint Considerations

### Mobile (320px - 768px)
- Image will be significantly cropped due to portrait orientation
- Focus subject should be centered vertically and horizontally
- Consider mobile-specific version: 768 × 1024 pixels

### Tablet (768px - 1024px)
- Good coverage with recommended 2560×1440 size
- Landscape tablets work well with 16:9 ratio

### Desktop (1024px+)
- Primary target for the 2560×1440 recommendation
- Ultrawide monitors (3440×1440) will crop sides slightly

## Technical Requirements

### File Format
- **Primary**: WebP (modern browsers, ~30% smaller than JPEG)
- **Fallback**: JPEG (universal compatibility)
- **Avoid**: PNG (too large for photos)

### Compression Settings
- **WebP**: Quality 80-85
- **JPEG**: Quality 85-90
- **Progressive JPEG**: Recommended for better perceived loading

### File Size Targets
- **Maximum**: 1MB
- **Optimal**: 400-600KB
- **Mobile-optimized version**: <300KB

## Content Guidelines

### Subject Matter
- **Himalayan landscapes**: Mountains, valleys, trails
- **Lighting**: Golden hour or blue hour preferred
- **Weather**: Clear or dramatic skies work best with overlay

### Composition Requirements
- **Safe zones**: Keep important elements away from edges
- **Center focus**: Main subject should be center-weighted
- **Contrast**: Ensure text readability with dark overlay
- **Horizon placement**: Rule of thirds (upper or lower third)

### Colors
- **Complement brand colors**: 
  - VH Green Dark: `#2D4B3E`
  - VH Green Light: `#8DA78B`
  - VH Trail Brown: `#8B6B4F`
- **Avoid**: Overly saturated greens that clash with brand
- **Prefer**: Natural earth tones, blues, warm highlights

## Implementation Recommendations

### File Naming
```
hero-bg-2560x1440.webp
hero-bg-2560x1440.jpg
hero-bg-mobile-768x1024.webp
hero-bg-mobile-768x1024.jpg
```

### Responsive Implementation
```css
/* Desktop */
.hero-bg {
  background-image: url('/hero-bg-2560x1440.webp');
}

/* Mobile */
@media (max-width: 768px) {
  .hero-bg {
    background-image: url('/hero-bg-mobile-768x1024.webp');
  }
}

/* Fallback for older browsers */
.no-webp .hero-bg {
  background-image: url('/hero-bg-2560x1440.jpg');
}
```

### Performance Optimization
1. **Preload**: Add `<link rel="preload">` for hero image
2. **Lazy loading**: Not applicable for above-fold hero
3. **CDN**: Consider using Next.js Image optimization
4. **Compression**: Use tools like ImageOptim or Squoosh

## Next.js Integration

### Using Next.js Image Component (Recommended)
```jsx
import Image from 'next/image';

// Background implementation
<div className="relative min-h-screen">
  <Image
    src="/hero-bg-2560x1440.webp"
    alt="Himalayan landscape"
    fill
    className="object-cover"
    priority
    quality={85}
  />
  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
  {/* Content */}
</div>
```

### Benefits of Next.js Image:
- Automatic WebP conversion
- Responsive image generation
- Lazy loading (disabled with `priority`)
- Automatic optimization

## Testing Checklist

- [ ] Image loads quickly on 3G connection
- [ ] Text remains readable with overlay
- [ ] Composition works on mobile portrait
- [ ] No pixelation on large screens
- [ ] File size under 1MB
- [ ] WebP format supported
- [ ] JPEG fallback works
- [ ] Preloading implemented
- [ ] Responsive breakpoints tested

## File Size Budget

| Device | Format | Max Size | Optimal Size |
|--------|--------|----------|--------------|
| Desktop | WebP | 800KB | 500KB |
| Desktop | JPEG | 1MB | 650KB |
| Mobile | WebP | 400KB | 250KB |
| Mobile | JPEG | 500KB | 350KB |

## Current vs Recommended

| Aspect | Current (Unsplash) | Recommended |
|--------|-------------------|-------------|
| Source | External URL | Local file |
| Size | 2070px width | 2560×1440px |
| Format | JPEG | WebP + JPEG fallback |
| Loading | Network dependent | Optimized/cached |
| Control | Limited | Full control |
| Performance | Variable | Predictable |