# Polygon Geofence Support - Migration Guide

This document outlines the changes needed to support polygon geofences in addition to circular geofences. The management portal has been updated to support both types, and the following changes are needed in `tunego-live-events-nextjs` to consume this new functionality.

## Database Schema Changes

The `events` table now includes two new fields:

1. **`geofence_type`** (text, nullable): Either `'circle'` or `'polygon'`
2. **`geofence_polygon`** (jsonb, nullable): Array of `[lat, lng]` coordinate pairs for polygon geofences

### Migration SQL

```sql
ALTER TABLE events 
ADD COLUMN geofence_type TEXT,
ADD COLUMN geofence_polygon JSONB;
```

**Note**: Existing events will have `geofence_type = NULL`, which should be treated as `'circle'` for backward compatibility.

## API Changes

### Event Data Structure

Events now return the following geofence-related fields:

```typescript
{
  geofenceType: "circle" | "polygon" | null,
  geofenceLatitude: string | null,      // For circle geofences
  geofenceLongitude: string | null,      // For circle geofences
  geofenceRadius: number | null,         // For circle geofences (meters)
  geofencePolygon: Array<[number, number]> | null  // For polygon geofences: [[lat, lng], ...]
}
```

## Required Changes in `tunego-live-events-nextjs`

### 1. Update Geofence Checking Logic

**File**: `src/lib/geofence.ts`

Add a function to check if a point is within a polygon using the ray casting algorithm:

```typescript
/**
 * Check if a point is within a polygon using ray casting algorithm
 * @param point [latitude, longitude] of the point to check
 * @param polygon Array of [lat, lng] coordinate pairs forming the polygon
 * @returns true if point is inside the polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: Array<[number, number]>
): boolean {
  const [lat, lng] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = 
      ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}
```

Update the main geofence checking function to handle both types:

```typescript
/**
 * Check if a point is within a geofence (circle or polygon)
 */
export function isWithinGeofence(
  lat: number,
  lng: number,
  geofenceType: "circle" | "polygon" | null,
  centerLat?: number,
  centerLng?: number,
  radiusMeters?: number,
  polygon?: Array<[number, number]>
): boolean {
  // Default to circle for backward compatibility
  const type = geofenceType || "circle";
  
  if (type === "polygon" && polygon && polygon.length >= 3) {
    return isPointInPolygon([lat, lng], polygon);
  } else if (type === "circle") {
    // Use existing circle logic
    const centerLatFinal = centerLat ?? EVENT_GEOFENCE.center.latitude;
    const centerLngFinal = centerLng ?? EVENT_GEOFENCE.center.longitude;
    const radiusFinal = radiusMeters ?? EVENT_GEOFENCE.radius;
    
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat - centerLatFinal) * Math.PI / 180;
    const dLng = (lng - centerLngFinal) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(centerLatFinal * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radiusFinal;
  }
  
  return false;
}
```

### 2. Update API Route to Fetch Event Geofence Data

**File**: `src/app/api/geofence/route.ts`

Instead of hard-coding the geofence, fetch it from the database or an API endpoint:

```typescript
// Option 1: Fetch from database directly
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Option 2: Fetch from management portal API (if separate)
// const response = await fetch('https://management-portal-url/api/events/active');
// const events = await response.json();

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    return new Response(JSON.stringify({
      status: "error",
      message: "Unauthorized"
    }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const { latitude, longitude, eventId } = body;

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(JSON.stringify({
        status: "error",
        message: "Invalid coordinates provided"
      }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Fetch event from database
    // Replace 'event-2025-fireworks' with the actual eventId or fetch active events
    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId || 'event-2025-fireworks'))
      .limit(1);

    if (!event) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Event not found"
      }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    // Parse geofence polygon if it exists
    const geofencePolygon = event.geofencePolygon 
      ? (typeof event.geofencePolygon === 'string' 
          ? JSON.parse(event.geofencePolygon) 
          : event.geofencePolygon)
      : null;

    // Check if user is within the geofence
    const isWithinEvent = isWithinGeofence(
      latitude,
      longitude,
      event.geofenceType || 'circle',
      event.geofenceLatitude ? parseFloat(event.geofenceLatitude) : undefined,
      event.geofenceLongitude ? parseFloat(event.geofenceLongitude) : undefined,
      event.geofenceRadius || undefined,
      geofencePolygon
    );

    // Return response...
  } catch (error) {
    // Error handling...
  }
}
```

### 3. Update Client-Side Geofence Configuration

**File**: `src/lib/geofence.ts`

Update `EVENT_GEOFENCE` to be fetched dynamically or include polygon support:

```typescript
// Option 1: Keep hard-coded for now, but add polygon support
export const EVENT_GEOFENCE = {
  type: "circle" as "circle" | "polygon",
  center: {
    latitude: 36.150467,
    longitude: -115.332843
  },
  radius: 200,
  polygon: null as Array<[number, number]> | null, // Add polygon support
  eventId: "event-2025-fireworks",
  eventName: "King & Princeとうちあげ花火2025"
};

// Option 2: Fetch from API (recommended for production)
export async function getEventGeofence(eventId?: string) {
  try {
    const response = await fetch(`/api/events/${eventId || 'active'}`);
    const event = await response.json();
    
    return {
      type: event.geofenceType || 'circle',
      center: event.geofenceLatitude && event.geofenceLongitude
        ? { latitude: parseFloat(event.geofenceLatitude), longitude: parseFloat(event.geofenceLongitude) }
        : null,
      radius: event.geofenceRadius,
      polygon: event.geofencePolygon 
        ? (typeof event.geofencePolygon === 'string' ? JSON.parse(event.geofencePolygon) : event.geofencePolygon)
        : null,
      eventId: event.id,
      eventName: event.name
    };
  } catch (error) {
    console.error('Failed to fetch event geofence:', error);
    return EVENT_GEOFENCE; // Fallback to default
  }
}
```

### 4. Update Database Schema (if using Drizzle)

**File**: `src/lib/db/schema.ts` (if it exists)

Add the new fields to the events table schema:

```typescript
export const events = pgTable('events', {
  // ... existing fields ...
  geofenceType: text('geofence_type'),
  geofencePolygon: jsonb('geofence_polygon'),
  // ... rest of fields ...
});
```

## Testing Checklist

- [ ] Test circle geofence checking (should work as before)
- [ ] Test polygon geofence checking with various polygon shapes
- [ ] Test edge cases: point on polygon boundary, point outside, point inside
- [ ] Test with events that have no geofence (null values)
- [ ] Test backward compatibility with existing events (null geofenceType)
- [ ] Verify API responses include new geofence fields
- [ ] Test client-side geofence checking with both types

## Migration Steps

1. **Run database migration** to add new columns
2. **Update geofence checking logic** in `src/lib/geofence.ts`
3. **Update API route** in `src/app/api/geofence/route.ts` to fetch from database
4. **Update client-side code** to handle both geofence types
5. **Test thoroughly** with both circle and polygon geofences
6. **Deploy** and monitor for any issues

## Notes

- **Backward Compatibility**: Events with `geofenceType = null` should be treated as circle geofences
- **Polygon Validation**: Ensure polygons have at least 3 points before checking
- **Coordinate Format**: Polygon coordinates are stored as `[[lat, lng], [lat, lng], ...]`
- **Performance**: Polygon checking is O(n) where n is the number of polygon vertices. For very large polygons (>100 points), consider optimization.

## Example Polygon Geofence

A polygon geofence for a rectangular area might look like:

```json
[
  [36.1500, -115.3400],
  [36.1600, -115.3400],
  [36.1600, -115.3300],
  [36.1500, -115.3300],
  [36.1500, -115.3400]  // Closing the polygon (first point repeated)
]
```

Note: The polygon should be closed (first and last points should be the same), though the ray casting algorithm will work either way.
