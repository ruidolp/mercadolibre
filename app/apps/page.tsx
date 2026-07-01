// app/apps/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MlApp } from "@/lib/schema";

export default function AppsPage() {
  const [apps, setApps] = useState<MlApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadApps() {
    try {
      const res = await fetch("/api/apps");
      if (!res.ok) throw new Error("Error al cargar apps");
      setApps(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminar la app "${name}" y todos sus tokens?`)) return;

    const res = await fetch(`/api/apps/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setApps((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Error al eliminar la app");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Apps de MercadoLibre</h1>
        <Link
          href="/apps/new"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nueva App
        </Link>
      </div>

      {loading && (
        <p className="text-gray-400 text-sm">Cargando...</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && apps.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-3">No hay apps registradas.</p>
          <Link
            href="/apps/new"
            className="text-yellow-600 underline text-sm"
          >
            Registrar la primera app
          </Link>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className="grid gap-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{app.name}</h3>
                  <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div>
                      <dt className="text-xs text-gray-400 uppercase tracking-wide">
                        Client ID
                      </dt>
                      <dd className="font-mono text-gray-700 truncate">
                        {app.client_id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400 uppercase tracking-wide">
                        Redirect URI
                      </dt>
                      <dd className="text-gray-700 truncate">
                        {app.redirect_uri}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400 uppercase tracking-wide">
                        Creada
                      </dt>
                      <dd className="text-gray-500">
                        {new Date(app.created_at).toLocaleDateString("es-AR")}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={`/api/auth/${app.id}/authorize`}
                    className="border border-yellow-400 hover:bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Conectar cuenta
                  </a>
                  <button
                    onClick={() => handleDelete(app.id, app.name)}
                    className="border border-red-200 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
