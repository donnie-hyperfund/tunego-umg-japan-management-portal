import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

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
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const checkIns = await db
      .select()
      .from(schema.eventCheckIns)
      .where(eq(schema.eventCheckIns.eventId, id))
      .orderBy(desc(schema.eventCheckIns.checkedInAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select()
      .from(schema.eventCheckIns)
      .where(eq(schema.eventCheckIns.eventId, id));

    return NextResponse.json({
      checkIns,
      total: total.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 }
    );
  }
}
