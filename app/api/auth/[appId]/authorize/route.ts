// app/api/auth/[appId]/authorize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildAuthorizationUrl } from "@/lib/ml-oauth";

type RouteParams = { params: Promise<{ appId: string }> };

/**
 * GET /api/auth/[appId]/authorize
 *
 * Looks up the registered app, builds the MercadoLibre authorization URL,
 * and redirects the user to complete the OAuth consent flow.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { appId } = await params;

  try {
    const app = await db
      .selectFrom("ml_apps")
      .select(["client_id", "redirect_uri"])
      .where("id", "=", appId)
      .executeTakeFirst();

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const authUrl = buildAuthorizationUrl(app.client_id, app.redirect_uri, appId);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error(`[GET /api/auth/${appId}/authorize]`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
