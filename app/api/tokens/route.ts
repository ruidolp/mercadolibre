// app/api/tokens/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/tokens — List all stored tokens with their associated app info.
 */
export async function GET() {
  try {
    const tokens = await db
      .selectFrom("ml_tokens")
      .innerJoin("ml_apps", "ml_apps.id", "ml_tokens.app_id")
      .select([
        "ml_tokens.id",
        "ml_tokens.app_id",
        "ml_tokens.ml_user_id",
        "ml_tokens.token_type",
        "ml_tokens.expires_in",
        "ml_tokens.expires_at",
        "ml_tokens.scope",
        "ml_tokens.created_at",
        "ml_tokens.updated_at",
        "ml_apps.name as app_name",
        "ml_apps.client_id as app_client_id",
      ])
      .orderBy("ml_tokens.created_at", "desc")
      .execute();

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("[GET /api/tokens]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
