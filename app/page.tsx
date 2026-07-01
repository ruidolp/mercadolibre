import Link from "next/link";
import { db } from "@/lib/db";
import type { MLCategory } from "@/lib/ml-types";

export const dynamic = "force-dynamic";

async function getAccessToken(): Promise<string | null> {
  try {
    const row = await db
      .selectFrom("ml_tokens")
      .select(["access_token"])
      .where("expires_at", ">", new Date())
      .orderBy("updated_at", "desc")
      .executeTakeFirst();
    return row?.access_token ?? null;
  } catch {
    return null;
  }
}

// Categorías de MLC como fallback si la API no responde
const MLC_CATEGORIES_FALLBACK: MLCategory[] = [
  { id: "MLC1000", name: "Electrónica, Audio y Video" },
  { id: "MLC1001", name: "Computación" },
  { id: "MLC1002", name: "Celulares y Telefonía" },
  { id: "MLC1003", name: "Cámaras y Accesorios" },
  { id: "MLC1004", name: "Videojuegos y Consolas" },
  { id: "MLC1010", name: "Hogar, Muebles y Jardín" },
  { id: "MLC1013", name: "Herramientas y Construcción" },
  { id: "MLC1019", name: "Deportes y Fitness" },
  { id: "MLC1020", name: "Juguetes y Bebés" },
  { id: "MLC1144", name: "Ropa y Accesorios" },
  { id: "MLC1132", name: "Autos, Motos y Otros" },
  { id: "MLC1743", name: "Inmuebles" },
  { id: "MLC1459", name: "Servicios" },
  { id: "MLC1051", name: "Industrias y Oficinas" },
  { id: "MLC1218", name: "Animales y Mascotas" },
  { id: "MLC3025", name: "Alimentos y Bebidas" },
  { id: "MLC1367", name: "Arte, Librería y Mercería" },
  { id: "MLC1499", name: "Bebés" },
  { id: "MLC1168", name: "Música, Películas y Series" },
  { id: "MLC1182", name: "Antigüedades y Colecciones" },
];

async function getCategories(token: string | null): Promise<{ categories: MLCategory[]; fromFallback: boolean }> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("https://api.mercadolibre.com/sites/MLC/categories", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers,
    });
    if (!res.ok) {
      console.error(`[getCategories] ML API responded ${res.status}`);
      return { categories: MLC_CATEGORIES_FALLBACK, fromFallback: true };
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { categories: MLC_CATEGORIES_FALLBACK, fromFallback: true };
    }
    return { categories: data as MLCategory[], fromFallback: false };
  } catch (err) {
    console.error("[getCategories] fetch failed:", err);
    return { categories: MLC_CATEGORIES_FALLBACK, fromFallback: true };
  }
}

export default async function Home() {
  const token = await getAccessToken();
  const { categories, fromFallback } = await getCategories(token);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#FFE600] font-black text-gray-900 text-lg select-none">
            ML
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            MercadoLibre Insights
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          Explorá las tendencias de búsqueda por categoría
        </p>
        {fromFallback && (
          <p className="text-xs text-amber-600 mt-1">
            Categorías en modo offline — mostrando lista predeterminada de MLC.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <Link href="/trends/global" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 rounded-xl">
          <div className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-[#FFE600] p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 min-h-[120px]">
            <span className="text-3xl" aria-hidden="true">🌎</span>
            <span className="text-sm font-black text-gray-900 text-center uppercase tracking-wide">
              Global
            </span>
          </div>
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/trends/${cat.id}`}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 rounded-xl"
          >
            <div className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 min-h-[120px] border border-gray-100">
              <span className="text-2xl" aria-hidden="true">🏷️</span>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
