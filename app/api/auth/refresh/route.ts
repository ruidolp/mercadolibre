// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshAccessToken, calculateExpiresAt } from "@/lib/ml-oauth";

/**
 * POST /api/auth/refresh
 *
 * Body: { tokenId: string }
 *
 * Fetches a new access_token from MercadoLibre using the stored refresh_token
 * and updates the record in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId } = body as { tokenId?: string };

    if (!tokenId) {
      return NextResponse.json(
        { error: "Missing required field: tokenId" },
        { status: 400 }
      );
    }

    // Load token + its associated app credentials in one query
    const row = await db
      .selectFrom("ml_tokens")
      .innerJoin("ml_apps", "ml_apps.id", "ml_tokens.app_id")
      .select([
        "ml_tokens.id",
        "ml_tokens.refresh_token",
        "ml_apps.client_id",
        "ml_apps.client_secret",
      ])
      .where("ml_tokens.id", "=", tokenId)
      .executeTakeFirst();

    if (!row) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const tokenData = await refreshAccessToken(
      row.client_id,
      row.client_secret,
      row.refresh_token
    );

    const expiresAt = calculateExpiresAt(tokenData.expires_in);

    const updated = await db
      .updateTable("ml_tokens")
      .set({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: expiresAt,
        scope: tokenData.scope,
        updated_at: new Date(),
      })
      .where("id", "=", tokenId)
      .returning([
        "id",
        "ml_user_id",
        "token_type",
        "expires_in",
        "expires_at",
        "scope",
        "updated_at",
      ])
      .executeTakeFirstOrThrow();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/auth/refresh]", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
