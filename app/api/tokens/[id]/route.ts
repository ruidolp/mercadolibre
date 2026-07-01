// app/api/tokens/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * DELETE /api/tokens/[id] — Revoke (delete) a stored token.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const deleted = await db
      .deleteFrom("ml_tokens")
      .where("id", "=", id)
      .returning(["id"])
      .executeTakeFirst();

    if (!deleted) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE /api/tokens/${id}]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
