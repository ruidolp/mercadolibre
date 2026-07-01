// lib/ml-oauth.ts
/**
 * MercadoLibre OAuth 2.0 helpers.
 *
 * Docs: https://developers.mercadolibre.cl/es_cl/autenticacion-y-autorizacion
 *
 * La URL de autorización es por país (auth.mercadolibre.cl para Chile).
 * El endpoint de tokens es compartido por todos los países.
 */

const ML_AUTH_URL = "https://auth.mercadolibre.cl/authorization";
const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

export interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface MLErrorResponse {
  message: string;
  error: string;
  status: number;
  cause?: unknown[];
}

/**
 * Build the authorization URL to redirect the user to MercadoLibre.
 */
export function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read write offline_access",
  });

  return `${ML_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access/refresh tokens.
 */
export async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<MLTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as MLErrorResponse;
    throw new Error(
      `ML token exchange failed: ${errorBody.message ?? response.statusText}`
    );
  }

  return response.json() as Promise<MLTokenResponse>;
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<MLTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as MLErrorResponse;
    throw new Error(
      `ML token refresh failed: ${errorBody.message ?? response.statusText}`
    );
  }

  return response.json() as Promise<MLTokenResponse>;
}

/**
 * Calculate the token expiration date from the current time and expires_in seconds.
 */
export function calculateExpiresAt(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}

/**
 * Check whether a token expiration date is in the past.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}
