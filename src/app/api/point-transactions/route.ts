import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { desc, eq, and, gte, lte, like, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userIdFilter = searchParams.get("userId");
    const sourceFilter = searchParams.get("source");
    const typeFilter = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(schema.pointTransactions);

    const conditions = [];

    if (userIdFilter) {
      conditions.push(eq(schema.pointTransactions.userId, userIdFilter));
    }
    if (sourceFilter) {
      conditions.push(eq(schema.pointTransactions.source, sourceFilter));
    }
    if (typeFilter) {
      conditions.push(eq(schema.pointTransactions.transactionType, typeFilter));
    }
    if (startDate) {
      conditions.push(gte(schema.pointTransactions.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(schema.pointTransactions.createdAt, new Date(endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const transactions = await query
      .orderBy(desc(schema.pointTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select()
      .from(schema.pointTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = totalResult.length;

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching point transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch point transactions" },
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
      userId: targetUserId,
      points,
      transactionType,
      source,
      description,
      metadata,
    } = body;

    const [transaction] = await db
      .insert(schema.pointTransactions)
      .values({
        userId: targetUserId,
        points,
        transactionType: transactionType || "adjusted",
        source: source || "manual_adjustment",
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating point transaction:", error);
    return NextResponse.json(
      { error: "Failed to create point transaction" },
      { status: 500 }
    );
  }
}
