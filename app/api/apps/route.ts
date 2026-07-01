// app/api/apps/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NewMlApp } from "@/lib/schema";

/**
 * GET /api/apps — List all registered MercadoLibre apps.
 */
export async function GET() {
  try {
    const apps = await db
      .selectFrom("ml_apps")
      .select(["id", "name", "client_id", "redirect_uri", "created_at", "updated_at"])
      .orderBy("created_at", "desc")
      .execute();

    return NextResponse.json(apps);
  } catch (error) {
    console.error("[GET /api/apps]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/apps — Register a new MercadoLibre app.
 * Body: { name, client_id, client_secret, redirect_uri }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, client_id, client_secret, redirect_uri } = body as Partial<NewMlApp>;

    if (!name || !client_id || !client_secret || !redirect_uri) {
      return NextResponse.json(
        { error: "Missing required fields: name, client_id, client_secret, redirect_uri" },
        { status: 400 }
      );
    }

    const app = await db
      .insertInto("ml_apps")
      .values({ name, client_id, client_secret, redirect_uri })
      .returning(["id", "name", "client_id", "redirect_uri", "created_at", "updated_at"])
      .executeTakeFirstOrThrow();

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    console.error("[POST /api/apps]", error);

    // Unique constraint violation on client_id
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "An app with this client_id already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
