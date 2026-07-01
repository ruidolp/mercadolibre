import Link from "next/link";
import type { MLCategory } from "@/lib/ml-types";

export const dynamic = "force-dynamic";

async function getCategories(): Promise<MLCategory[] | null> {
  try {
    const res = await fetch("https://api.mercadolibre.com/sites/MLC/categories", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as MLCategory[]) : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const categories = await getCategories();

  return (
    <div>
      {/* Page header */}
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
      </div>

      {categories === null ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-red-700 font-medium text-lg">
            No se pudieron cargar las categorías
          </p>
          <p className="text-red-500 text-sm mt-1">
            Revisá tu conexión o intentá de nuevo más tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* GLOBAL card — visually distinct */}
          <Link href="/trends/global" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 rounded-xl">
            <div className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-[#FFE600] p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 min-h-[120px]">
              <span className="text-3xl" aria-hidden="true">🌎</span>
              <span className="text-sm font-black text-gray-900 text-center uppercase tracking-wide">
                Global
              </span>
            </div>
          </Link>

          {/* One card per category */}
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
      )}
    </div>
  );
}
