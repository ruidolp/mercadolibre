// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MlApp, MlToken } from "@/lib/schema";

interface TokenWithApp extends MlToken {
  app_name: string;
  app_client_id: string;
}

function isExpired(expiresAt: string | Date): boolean {
  return new Date() >= new Date(expiresAt);
}

export default function DashboardPage() {
  const [apps, setApps] = useState<MlApp[]>([]);
  const [tokens, setTokens] = useState<TokenWithApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [appsRes, tokensRes] = await Promise.all([
        fetch("/api/apps"),
        fetch("/api/tokens"),
      ]);

      if (!appsRes.ok || !tokensRes.ok) {
        throw new Error("Error loading data from API");
      }

      const [appsData, tokensData] = await Promise.all([
        appsRes.json(),
        tokensRes.json(),
      ]);

      setApps(appsData);
      setTokens(tokensData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRefreshToken(tokenId: string) {
    setRefreshingId(tokenId);
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Refresh failed");
      }

      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error refreshing token");
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleRevokeToken(tokenId: string) {
    if (!confirm("Revocar este token?")) return;

    const res = await fetch(`/api/tokens/${tokenId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } else {
      alert("Error al revocar el token");
    }
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-16">Cargando...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/apps/new"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nueva App
        </Link>
      </div>

      {/* Apps Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Apps registradas ({apps.length})
        </h2>

        {apps.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay apps registradas.{" "}
            <Link href="/apps/new" className="text-yellow-600 underline">
              Crear una
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{app.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    client_id: {app.client_id}
                  </p>
                  <p className="text-xs text-gray-400">
                    redirect_uri: {app.redirect_uri}
                  </p>
                </div>
                <a
                  href={`/api/auth/${app.id}/authorize`}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Conectar cuenta ML
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tokens Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Tokens activos ({tokens.length})
        </h2>

        {tokens.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay tokens almacenados. Conecta una cuenta usando el botón de
            arriba.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                  <th className="pb-2 pr-4">Usuario ML</th>
                  <th className="pb-2 pr-4">App</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th className="pb-2 pr-4">Expira</th>
                  <th className="pb-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tokens.map((token) => {
                  const expired = isExpired(token.expires_at);
                  return (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-mono text-gray-700">
                        {token.ml_user_id}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {token.app_name}
                      </td>
                      <td className="py-3 pr-4">
                        {expired ? (
                          <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                            Expirado
                          </span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {new Date(token.expires_at).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => handleRefreshToken(token.id)}
                          disabled={refreshingId === token.id}
                          className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
                        >
                          {refreshingId === token.id
                            ? "Actualizando..."
                            : "Refresh"}
                        </button>
                        <button
                          onClick={() => handleRevokeToken(token.id)}
                          className="border border-red-200 hover:bg-red-50 text-red-600 px-3 py-1 rounded text-xs transition-colors"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
