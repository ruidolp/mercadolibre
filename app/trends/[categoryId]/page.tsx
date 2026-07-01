import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import type { MLCategory, MLTrend, MLHighlightItem } from "@/lib/ml-types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

function withToken(url: string, token: string | null): string {
  if (!token) return url;
  const u = new URL(url);
  u.searchParams.set("access_token", token);
  return u.toString();
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchCategoryInfo(categoryId: string, token: string | null): Promise<MLCategory | null> {
  try {
    const res = await fetch(
      withToken(`https://api.mercadolibre.com/categories/${categoryId}`, token),
      { cache: "no-store", headers: authHeaders(token) }
    );
    if (!res.ok) return null;
    return (await res.json()) as MLCategory;
  } catch {
    return null;
  }
}

async function fetchTrends(url: string, token: string | null): Promise<MLTrend[] | null> {
  try {
    const res = await fetch(withToken(url, token), { cache: "no-store", headers: authHeaders(token) });
    if (!res.ok) {
      console.error(`[fetchTrends] ${url} → ${res.status}`);
      return null;
    }
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as MLTrend[]) : null;
  } catch {
    return null;
  }
}

async function fetchHighlights(
  categoryId: string,
  token: string
): Promise<MLHighlightItem[] | null> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/highlights/MLC/category/${categoryId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data as MLHighlightItem[];
    // Some ML endpoints wrap results
    const wrapped = data as Record<string, unknown>;
    const inner = wrapped?.content ?? wrapped?.items ?? wrapped?.results;
    return Array.isArray(inner) ? (inner as MLHighlightItem[]) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrendSection({
  title,
  trends,
  accentClass,
}: {
  title: string;
  trends: MLTrend[] | null;
  accentClass: string;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-3 ${accentClass}`}>
        <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
          {title}
        </h2>
      </div>

      {trends === null ? (
        <p className="px-5 py-6 text-sm text-gray-400 italic">
          No hay datos disponibles para esta sección.
        </p>
      ) : (
        <ol className="divide-y divide-gray-50">
          {trends.slice(0, 20).map((trend, index) => (
            <li key={`${trend.keyword}-${index}`}>
              <a
                href={trend.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-400 w-6 text-right shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 truncate">
                  {trend.keyword}
                </span>
                <span className="ml-auto text-gray-300 group-hover:text-gray-400 text-xs shrink-0">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const isGlobal = categoryId === "global";

  // Obtener token primero — lo necesitan trends, categorías e highlights
  let accessToken: string | null = null;
  try {
    const tokenRow = await db
      .selectFrom("ml_tokens")
      .select(["access_token"])
      .where("expires_at", ">", new Date())
      .orderBy("updated_at", "desc")
      .executeTakeFirst();
    accessToken = tokenRow?.access_token ?? null;
  } catch {
    accessToken = null;
  }

  const baseUrl = isGlobal
    ? "https://api.mercadolibre.com/trends/MLC"
    : `https://api.mercadolibre.com/trends/MLC/${categoryId}`;

  // Fetches en paralelo
  const [categoryInfo, allTrends, highlights] = await Promise.all([
    isGlobal ? Promise.resolve(null) : fetchCategoryInfo(categoryId, accessToken),
    fetchTrends(baseUrl, accessToken),
    !isGlobal && accessToken ? fetchHighlights(categoryId, accessToken) : Promise.resolve(null),
  ]);

  // ML devuelve 50 items en un solo array ordenado por posición:
  // [0..9]  → mayor crecimiento (fastest growing)
  // [10..29] → más buscados (most wanted)
  // [30..49] → más populares (most popular)
  const fastestGrowing = allTrends?.slice(0, 10) ?? null;
  const mostSearched   = allTrends?.slice(10, 30) ?? null;
  const mostPopular    = allTrends?.slice(30, 50) ?? null;

  const categoryName = isGlobal
    ? "Global"
    : (categoryInfo?.name ?? categoryId);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-gray-800 transition-colors">
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium" aria-current="page">
          {categoryName}
        </span>
      </nav>

      {/* Page title */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#FFE600] shrink-0"
          aria-hidden="true"
        >
          {isGlobal ? "🌎" : "🏷️"}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Tendencias &mdash; {categoryName}
        </h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Trend sections (stacked, no client-side JS required)               */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendSection
          title="Más buscados"
          trends={mostSearched}
          accentClass="bg-[#FFE600]"
        />
        <TrendSection
          title="Mayor crecimiento"
          trends={fastestGrowing}
          accentClass="bg-emerald-100"
        />
        <TrendSection
          title="Más populares"
          trends={mostPopular}
          accentClass="bg-sky-100"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top vendidos — solo cuando hay categoryId real                     */}
      {/* ------------------------------------------------------------------ */}
      {!isGlobal && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Top 20 Más Vendidos
          </h2>

          {accessToken === null ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-8 text-center">
              <p className="text-yellow-800 font-medium mb-2">
                Conecta una cuenta ML en el Dashboard para ver los más vendidos
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-2 bg-[#FFE600] hover:bg-yellow-300 text-gray-900 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              >
                Ir al Dashboard
              </Link>
            </div>
          ) : highlights === null || highlights.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-8 text-center text-gray-400 text-sm">
              No hay datos de más vendidos disponibles para esta categoría.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <ol className="divide-y divide-gray-50">
                {highlights.slice(0, 20).map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Position badge */}
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                        index === 0
                          ? "bg-[#FFE600] text-gray-900"
                          : index === 1
                          ? "bg-gray-200 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>

                    {/* Thumbnail */}
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title ?? `Producto #${index + 1}`}
                        width={48}
                        height={48}
                        className="rounded-md object-contain bg-gray-50 border border-gray-100 shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-md bg-gray-100 shrink-0"
                        aria-hidden="true"
                      />
                    )}

                    {/* Title and price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.title ?? "Sin nombre"}
                      </p>
                      {item.price !== undefined && item.price !== null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          ${item.price.toLocaleString("es-CL")}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
