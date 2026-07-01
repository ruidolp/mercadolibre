// app/api/debug-env/route.ts
// TEMPORAL — eliminar antes de producción real
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    has_postgres_url: !!process.env.POSTGRES_URL,
    has_database_url: !!process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
  });
}
