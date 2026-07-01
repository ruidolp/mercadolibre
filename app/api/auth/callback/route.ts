// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  exchangeCodeForTokens,
  calculateExpiresAt,
} from "@/lib/ml-oauth";

/**
 * GET /api/auth/callback
 *
 * MercadoLibre redirects here after the user grants authorization.
 * Query params: ?code=XXX (and optionally ?state=XXX)
 *
 * We need to know which app config to use. Two strategies:
 *   1. Pass appId as a state param when building the auth URL.
 *   2. Match by redirect_uri (this file's URL).
 *
 * Here we use strategy 1: the state param carries the appId.
 * If no state is present we fall back to the first registered app
 * (suitable for single-app setups).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // expected to be the appId

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  try {
    // Resolve the app: prefer appId from state, fall back to first app
    let app: {
      id: string;
      client_id: string;
      client_secret: string;
      redirect_uri: string;
    } | undefined;

    if (state) {
      app = await db
        .selectFrom("ml_apps")
        .select(["id", "client_id", "client_secret", "redirect_uri"])
        .where("id", "=", state)
        .executeTakeFirst();
    }

    if (!app) {
      app = await db
        .selectFrom("ml_apps")
        .select(["id", "client_id", "client_secret", "redirect_uri"])
        .orderBy("created_at", "asc")
        .executeTakeFirst();
    }

    if (!app) {
      return NextResponse.json(
        { error: "No registered app found to complete the OAuth flow" },
        { status: 500 }
      );
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(
      app.client_id,
      app.client_secret,
      code,
      app.redirect_uri
    );

    const expiresAt = calculateExpiresAt(tokenData.expires_in);
    const mlUserId = String(tokenData.user_id);

    // Upsert: if a token for this (app, user) already exists, replace it
    const existing = await db
      .selectFrom("ml_tokens")
      .select(["id"])
      .where("app_id", "=", app.id)
      .where("ml_user_id", "=", mlUserId)
      .executeTakeFirst();

    if (existing) {
      await db
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
        .where("id", "=", existing.id)
        .execute();
    } else {
      await db
        .insertInto("ml_tokens")
        .values({
          app_id: app.id,
          ml_user_id: mlUserId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          expires_at: expiresAt,
          scope: tokenData.scope,
        })
        .execute();
    }

    // Redirect to dashboard after successful auth
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error("[GET /api/auth/callback]", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorUrl = new URL("/dashboard", request.url);
    errorUrl.searchParams.set("error", errorMessage);

    return NextResponse.redirect(errorUrl);
  }
}
