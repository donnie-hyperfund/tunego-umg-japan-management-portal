import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Drizzle returns JSONB as objects/arrays directly
    let geofencePolygon = event.geofencePolygon;
    if (geofencePolygon && typeof geofencePolygon === "string") {
      try {
        geofencePolygon = JSON.parse(geofencePolygon);
      } catch (e) {
        console.error("[API GET] Failed to parse geofencePolygon:", e);
        geofencePolygon = null;
      }
    }
    // If it's an empty array, treat as null
    if (Array.isArray(geofencePolygon) && geofencePolygon.length === 0) {
      geofencePolygon = null;
    }
    
    let metadata = event.metadata;
    if (metadata && typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error("[API GET] Failed to parse metadata:", e);
        metadata = null;
      }
    }
    
    const parsedEvent = {
      ...event,
      startDate: event.startDate instanceof Date ? event.startDate.toISOString() : new Date(event.startDate).toISOString(),
      endDate: event.endDate instanceof Date ? event.endDate.toISOString() : new Date(event.endDate).toISOString(),
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
      updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : new Date(event.updatedAt).toISOString(),
      geofencePolygon,
      metadata,
    };

    return NextResponse.json(parsedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Partial<{
      name: string;
      description: string | null;
      startDate: Date;
      endDate: Date;
      location: string | null;
      geofenceType: string | null;
      geofenceLatitude: string | null;
      geofenceLongitude: string | null;
      geofenceRadius: number | null;
      geofencePolygon: Array<[number, number]> | null;
      isActive: boolean;
      metadata: string | null;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate !== undefined) {
      const startDateObj = new Date(body.startDate);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date format" },
          { status: 400 }
        );
      }
      updateData.startDate = startDateObj;
    }
    if (body.endDate !== undefined) {
      const endDateObj = new Date(body.endDate);
      if (isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date format" },
          { status: 400 }
        );
      }
      updateData.endDate = endDateObj;
    }
    if (body.location !== undefined) updateData.location = body.location;
    if (body.geofenceType !== undefined) updateData.geofenceType = body.geofenceType || null;
    if (body.geofenceLatitude !== undefined) {
      updateData.geofenceLatitude = body.geofenceLatitude ? String(body.geofenceLatitude) : null;
    }
    if (body.geofenceLongitude !== undefined) {
      updateData.geofenceLongitude = body.geofenceLongitude ? String(body.geofenceLongitude) : null;
    }
    if (body.geofenceRadius !== undefined) updateData.geofenceRadius = body.geofenceRadius;
    if (body.geofencePolygon !== undefined) {
      // Drizzle JSONB accepts objects/arrays directly, no need to stringify
      // Only set if it's a valid non-empty array
      updateData.geofencePolygon = 
        body.geofencePolygon && 
        Array.isArray(body.geofencePolygon) && 
        body.geofencePolygon.length > 0 
          ? body.geofencePolygon 
          : null;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata ? JSON.stringify(body.metadata) : null;
    }

    const [event] = await db
      .update(schema.events)
      .set(updateData)
      .where(eq(schema.events.id, id))
      .returning();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Drizzle returns JSONB as objects/arrays directly
    let geofencePolygon = event.geofencePolygon;
    if (geofencePolygon && typeof geofencePolygon === "string") {
      try {
        geofencePolygon = JSON.parse(geofencePolygon);
      } catch (e) {
        console.error("[API PATCH] Failed to parse geofencePolygon:", e);
        geofencePolygon = null;
      }
    }
    // If it's an empty array, treat as null
    if (Array.isArray(geofencePolygon) && geofencePolygon.length === 0) {
      geofencePolygon = null;
    }
    
    let metadata = event.metadata;
    if (metadata && typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error("[API PATCH] Failed to parse metadata:", e);
        metadata = null;
      }
    }
    
    const parsedEvent = {
      ...event,
      startDate: event.startDate instanceof Date ? event.startDate.toISOString() : new Date(event.startDate).toISOString(),
      endDate: event.endDate instanceof Date ? event.endDate.toISOString() : new Date(event.endDate).toISOString(),
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
      updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : new Date(event.updatedAt).toISOString(),
      geofencePolygon,
      metadata,
    };

    return NextResponse.json(parsedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(schema.events).where(eq(schema.events.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
