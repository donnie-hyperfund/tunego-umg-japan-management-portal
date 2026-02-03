# CDN Dependencies Review

This document reviews all external resources loaded at runtime via CDN and provides mitigation strategies if those CDNs become unavailable.

## Summary

The application currently depends on **3 external CDN services**:
1. **Cloudflare CDN** (cdnjs.cloudflare.com) - Leaflet marker icons
2. **OpenStreetMap** (tile.openstreetmap.org) - Map tiles
3. **Unsplash** (images.unsplash.com) - Background images

---

## 1. Leaflet Marker Icons (Cloudflare CDN)

### Current Usage

**CDN URLs:**
- `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png`
- `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png`
- `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png`

**Files Affected:**
- `src/components/events/MapPicker.tsx` (lines 16-18)
- `src/components/events/GeofencePreview.tsx` (lines 13-15)

**Impact:** Medium - Map markers will fail to display if CDN is unavailable, but maps will still function.

### Mitigation Strategy

**Option 1: Bundle icons with the application (RECOMMENDED)**

1. Download the marker icons from the Leaflet package:
   ```bash
   # The icons are already in node_modules/leaflet/dist/images/
   # Copy them to public/images/leaflet/
   mkdir -p public/images/leaflet
   cp node_modules/leaflet/dist/images/marker-icon.png public/images/leaflet/
   cp node_modules/leaflet/dist/images/marker-icon-2x.png public/images/leaflet/
   cp node_modules/leaflet/dist/images/marker-shadow.png public/images/leaflet/
   ```

2. Update both components to use local paths:
   ```typescript
   L.Icon.Default.mergeOptions({
     iconRetinaUrl: "/images/leaflet/marker-icon-2x.png",
     iconUrl: "/images/leaflet/marker-icon.png",
     shadowUrl: "/images/leaflet/marker-shadow.png",
   });
   ```

**Option 2: Use alternative CDN**
- Switch to jsDelivr: `https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png`
- Switch to unpkg: `https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png`

**Option 3: Self-host on your own CDN**
- Upload icons to your own static hosting (Vercel, AWS S3, etc.)

---

## 2. OpenStreetMap Tiles

### Current Usage

**CDN URL Pattern:**
- `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

**Files Affected:**
- `src/components/events/MapPicker.tsx` (line 316)
- `src/components/events/GeofencePreview.tsx` (line 138)

**Impact:** High - Maps will not display if OpenStreetMap tiles are unavailable.

### Mitigation Strategy

**Option 1: Use multiple tile providers with fallback (RECOMMENDED)**

Create a utility function to handle tile layer fallbacks:

```typescript
// src/lib/mapUtils.ts
import { TileLayer } from 'react-leaflet';

export const TileLayerWithFallback = () => {
  const [tileUrl, setTileUrl] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  const [tileProvider, setTileProvider] = useState('OpenStreetMap');

  const fallbackProviders = [
    {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
      name: 'CartoDB',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    {
      name: 'Stamen',
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>'
    }
  ];

  const handleTileError = () => {
    const currentIndex = fallbackProviders.findIndex(p => p.name === tileProvider);
    if (currentIndex < fallbackProviders.length - 1) {
      const nextProvider = fallbackProviders[currentIndex + 1];
      setTileUrl(nextProvider.url);
      setTileProvider(nextProvider.name);
    }
  };

  return (
    <TileLayer
      url={tileUrl}
      attribution={fallbackProviders.find(p => p.url === tileUrl)?.attribution || ''}
      onError={handleTileError}
    />
  );
};
```

**Option 2: Use commercial tile providers**
- Mapbox (requires API key)
- Google Maps (requires API key)
- Esri ArcGIS (requires API key)

**Option 3: Self-host map tiles**
- Use tools like TileMill or MapTiler to generate and host your own tiles
- Requires significant infrastructure and storage

**Option 4: Use Leaflet's built-in error handling**

```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  errorTileUrl="/images/map-error-tile.png" // Fallback tile
  maxZoom={19}
  subdomains={['a', 'b', 'c']} // Use multiple subdomains for better reliability
/>
```

---

## 3. Unsplash Background Images

### Current Usage

**CDN URLs:**
- `https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2000&auto=format&fit=crop` (concert/event image)
- `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2000&auto=format&fit=crop` (points/rewards image)

**Files Affected:**
- `src/app/page.tsx` (lines 19, 45, 68)
- `src/app/events/page.tsx` (line 20)
- `src/app/points/page.tsx` (line 21)

**Impact:** Low - Background images are decorative and won't break functionality if unavailable.

### Mitigation Strategy

**Option 1: Download and host images locally (RECOMMENDED)**

1. Download the images:
   ```bash
   mkdir -p public/images/backgrounds
   # Download images and save as:
   # public/images/backgrounds/concert-hero.jpg
   # public/images/backgrounds/points-hero.jpg
   ```

2. Update all page files to use local paths:
   ```typescript
   backgroundImage: "url(/images/backgrounds/concert-hero.jpg)"
   ```

3. Add fallback CSS:
   ```css
   .hero-banner {
     background-color: var(--tunego-neutral-95); /* Fallback color */
     background-image: url(/images/backgrounds/concert-hero.jpg);
   }
   ```

**Option 2: Use Next.js Image component with fallback**

```typescript
import Image from 'next/image';

<div className="relative h-64 md:h-80 overflow-hidden">
  <Image
    src="/images/backgrounds/concert-hero.jpg"
    alt=""
    fill
    className="object-cover"
    onError={(e) => {
      // Fallback to gradient background
      e.currentTarget.style.display = 'none';
    }}
  />
  <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-[#060606]/90 to-[#060606]/70"></div>
</div>
```

**Option 3: Use CSS gradients as fallback**

The pages already have gradient overlays, so if images fail, the gradient will still provide visual appeal.

**Option 4: Use placeholder service**
- Use services like placeholder.com or via.placeholder.com as fallback
- Or use a data URI for a simple colored background

---

## Implementation Priority

### High Priority (Functionality Breaking)
1. **OpenStreetMap Tiles** - Maps won't work without tiles
   - Implement fallback tile providers
   - Add error handling

### Medium Priority (User Experience)
2. **Leaflet Marker Icons** - Maps work but markers don't display
   - Bundle icons locally

### Low Priority (Cosmetic)
3. **Unsplash Images** - Decorative backgrounds
   - Download and host locally
   - Add CSS fallbacks

---

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Bundle Leaflet marker icons locally
2. ✅ Download and host Unsplash images locally
3. ✅ Add error handling for tile loading

### Phase 2: Resilience (2-4 hours)
1. ✅ Implement tile provider fallback system
2. ✅ Add loading states and error messages
3. ✅ Test with network throttling/offline mode

### Phase 3: Monitoring (Ongoing)
1. ✅ Set up error tracking for failed CDN requests
2. ✅ Monitor CDN availability
3. ✅ Document fallback procedures

---

## Testing Checklist

- [ ] Test with network throttling (slow 3G)
- [ ] Test with CDN URLs blocked (use browser dev tools)
- [ ] Test offline mode
- [ ] Verify fallback images/icons load correctly
- [ ] Verify map tiles switch to fallback provider
- [ ] Test on different browsers
- [ ] Verify no console errors when CDNs fail

---

## Additional Notes

### Leaflet CSS
The Leaflet CSS files are imported from `node_modules` via:
- `import "leaflet/dist/leaflet.css"`
- `import "leaflet-draw/dist/leaflet.draw.css"`

These are bundled during build time, so they're not CDN dependencies. However, if the npm packages are unavailable during build, the build will fail.

### Clerk Authentication
Clerk is loaded from their CDN, but this is handled by the `@clerk/nextjs` package. If Clerk's CDN fails, authentication will break, but this is outside the scope of this review as it's a core service dependency.

### Next.js Assets
All assets in the `public/` directory are served by Next.js/Vercel, so they're not CDN dependencies.

---

## Quick Reference: Current CDN Dependencies

| Resource | CDN | Files | Impact | Status |
|----------|-----|-------|--------|--------|
| Leaflet Icons | cdnjs.cloudflare.com | MapPicker.tsx, GeofencePreview.tsx | Medium | ⚠️ Needs mitigation |
| Map Tiles | tile.openstreetmap.org | MapPicker.tsx, GeofencePreview.tsx | High | ⚠️ Needs mitigation |
| Background Images | images.unsplash.com | page.tsx, events/page.tsx, points/page.tsx | Low | ⚠️ Needs mitigation |
