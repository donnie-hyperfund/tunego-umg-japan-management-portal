import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db.select().from(schema.pointRules);
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching point rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch point rules" },
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
    const { name, description, points, source, isActive, metadata } = body;

    const [rule] = await db
      .insert(schema.pointRules)
      .values({
        name,
        description,
        points,
        source,
        isActive: isActive ?? true,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating point rule:", error);
    return NextResponse.json(
      { error: "Failed to create point rule" },
      { status: 500 }
    );
  }
}
