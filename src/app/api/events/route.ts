import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { desc, eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (isActive !== null) {
      conditions.push(eq(schema.events.isActive, isActive === "true"));
    }
    if (startDate) {
      conditions.push(gte(schema.events.startDate, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(schema.events.endDate, new Date(endDate)));
    }

    const baseQuery = db.select().from(schema.events);
    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const events = await query.orderBy(desc(schema.events.startDate));

    // Drizzle returns JSONB as objects/arrays directly, but handle both cases
    const parsedEvents = events.map((event) => {
      let geofencePolygon = event.geofencePolygon;
      if (geofencePolygon) {
        if (typeof geofencePolygon === "string") {
          try {
            geofencePolygon = JSON.parse(geofencePolygon);
          } catch (e) {
            console.error("[API] Failed to parse geofencePolygon:", e);
            geofencePolygon = null;
          }
        }
        // If it's an empty array, treat as null
        if (Array.isArray(geofencePolygon) && geofencePolygon.length === 0) {
          geofencePolygon = null;
        }
      }
      
      let metadata = event.metadata;
      if (metadata && typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error("[API] Failed to parse metadata:", e);
          metadata = null;
        }
      }
      
      return {
        ...event,
        startDate: event.startDate instanceof Date ? event.startDate.toISOString() : new Date(event.startDate).toISOString(),
        endDate: event.endDate instanceof Date ? event.endDate.toISOString() : new Date(event.endDate).toISOString(),
        createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
        updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : new Date(event.updatedAt).toISOString(),
        geofencePolygon,
        metadata,
      };
    });

    return NextResponse.json(parsedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      geofenceType,
      geofenceLatitude,
      geofenceLongitude,
      geofenceRadius,
      geofencePolygon,
      isActive,
      metadata,
    } = body;

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required", received: { startDate, endDate } },
        { status: 400 }
      );
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { 
          error: "Invalid date format", 
          details: {
            startDate: { value: startDate, parsed: startDateObj.toString(), isValid: !isNaN(startDateObj.getTime()) },
            endDate: { value: endDate, parsed: endDateObj.toString(), isValid: !isNaN(endDateObj.getTime()) }
          }
        },
        { status: 400 }
      );
    }

    const [event] = await db
      .insert(schema.events)
      .values({
        name,
        description,
        startDate: startDateObj,
        endDate: endDateObj,
        location,
        geofenceType: geofenceType || null,
        geofenceLatitude: geofenceLatitude ? String(geofenceLatitude) : null,
        geofenceLongitude: geofenceLongitude ? String(geofenceLongitude) : null,
        geofenceRadius,
        // Drizzle JSONB accepts objects/arrays directly, no need to stringify
        geofencePolygon: geofencePolygon && Array.isArray(geofencePolygon) && geofencePolygon.length > 0 ? geofencePolygon : null,
        isActive: isActive ?? true,
        metadata: metadata || null,
      })
      .returning();

    // Drizzle returns JSONB as objects/arrays directly
    let parsedGeofencePolygon = event.geofencePolygon;
    if (parsedGeofencePolygon && typeof parsedGeofencePolygon === "string") {
      try {
        parsedGeofencePolygon = JSON.parse(parsedGeofencePolygon);
      } catch (e) {
        console.error("[API] Failed to parse geofencePolygon:", e);
        parsedGeofencePolygon = null;
      }
    }
    if (Array.isArray(parsedGeofencePolygon) && parsedGeofencePolygon.length === 0) {
      parsedGeofencePolygon = null;
    }
    
    let parsedMetadata = event.metadata;
    if (parsedMetadata && typeof parsedMetadata === "string") {
      try {
        parsedMetadata = JSON.parse(parsedMetadata);
      } catch (e) {
        console.error("[API] Failed to parse metadata:", e);
        parsedMetadata = null;
      }
    }
    
    // Ensure dates are valid Date objects before serialization
    const parsedEvent = {
      ...event,
      startDate: event.startDate instanceof Date ? event.startDate.toISOString() : new Date(event.startDate).toISOString(),
      endDate: event.endDate instanceof Date ? event.endDate.toISOString() : new Date(event.endDate).toISOString(),
      geofencePolygon: parsedGeofencePolygon,
      metadata: parsedMetadata,
    };

    return NextResponse.json(parsedEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
