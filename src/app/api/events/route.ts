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

    let query = db.select().from(schema.events);

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

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const events = await query.orderBy(desc(schema.events.startDate));

    return NextResponse.json(events);
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

    const [event] = await db
      .insert(schema.events)
      .values({
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        geofenceType: geofenceType || null,
        geofenceLatitude: geofenceLatitude ? String(geofenceLatitude) : null,
        geofenceLongitude: geofenceLongitude ? String(geofenceLongitude) : null,
        geofenceRadius,
        geofencePolygon: geofencePolygon ? JSON.stringify(geofencePolygon) : null,
        isActive: isActive ?? true,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
