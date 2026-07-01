// app/api/debug-highlights/route.ts — TEMPORAL
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category") ?? "MLC1000";

  const tokenRow = await db
    .selectFrom("ml_tokens")
    .select(["access_token"])
    .where("expires_at", ">", new Date())
    .orderBy("updated_at", "desc")
    .executeTakeFirst();

  if (!tokenRow) return NextResponse.json({ error: "No token in DB" }, { status: 401 });

  const token = tokenRow.access_token;
  const url = `https://api.mercadolibre.com/highlights/MLC/category/${categoryId}?access_token=${token}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body: unknown = await res.json();

  return NextResponse.json({ status: res.status, url, body });
}
