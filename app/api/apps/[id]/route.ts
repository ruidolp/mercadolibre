// app/api/apps/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/apps/[id] — Update an existing app.
 * Body: partial { name, client_id, client_secret, redirect_uri }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, client_id, client_secret, redirect_uri, notifications_url } = body as {
      name?: string;
      client_id?: string;
      client_secret?: string;
      redirect_uri?: string;
      notifications_url?: string | null;
    };

    // Build only the fields that were provided
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (name !== undefined) updatePayload.name = name;
    if (client_id !== undefined) updatePayload.client_id = client_id;
    if (client_secret !== undefined) updatePayload.client_secret = client_secret;
    if (redirect_uri !== undefined) updatePayload.redirect_uri = redirect_uri;
    if (notifications_url !== undefined) updatePayload.notifications_url = notifications_url;

    const app = await db
      .updateTable("ml_apps")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updatePayload as any)
      .where("id", "=", id)
      .returning(["id", "name", "client_id", "redirect_uri", "notifications_url", "updated_at"])
      .executeTakeFirst();

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    return NextResponse.json(app);
  } catch (error) {
    console.error(`[PUT /api/apps/${id}]`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[id] — Remove an app and its associated tokens.
 * ON DELETE CASCADE is set in the DB, but we also clean up explicitly
 * in case the migration hasn't run yet.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const deleted = await db
      .deleteFrom("ml_apps")
      .where("id", "=", id)
      .returning(["id"])
      .executeTakeFirst();

    if (!deleted) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE /api/apps/${id}]`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
