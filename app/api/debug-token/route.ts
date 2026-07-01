// app/api/debug-token/route.ts — TEMPORAL, eliminar en producción
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const token = await db
      .selectFrom("ml_tokens")
      .select(["ml_user_id", "access_token", "scope", "expires_at", "updated_at"])
      .orderBy("updated_at", "desc")
      .executeTakeFirst();

    if (!token) {
      return NextResponse.json({ error: "No token found in DB" }, { status: 404 });
    }

    const [meRes, trendsRes] = await Promise.all([
      fetch("https://api.mercadolibre.com/users/me", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      }).then(r => r.json()).catch(e => ({ error: String(e) })),
      fetch("https://api.mercadolibre.com/trends/MLC", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      }).then(r => ({ status: r.status, body: r.status !== 200 ? null : "ok" }))
        .catch(e => ({ error: String(e) })),
    ]);

    return NextResponse.json({
      ml_user_id: token.ml_user_id,
      scope: token.scope,
      expires_at: token.expires_at,
      is_expired: new Date() > new Date(token.expires_at),
      api_check: {
        users_me: meRes,
        trends_mlc: trendsRes,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
