// app/apps/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  name: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  notifications_url: string;
}

export default function NewAppPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    client_id: "",
    client_secret: "",
    redirect_uri: process.env.NEXT_PUBLIC_DEFAULT_REDIRECT_URI ?? "",
    notifications_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al crear la app");
      }

      router.push("/apps");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Registrar nueva App
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-lg p-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre descriptivo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Mi tienda principal"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label
            htmlFor="client_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            App ID (Client ID)
          </label>
          <input
            id="client_id"
            name="client_id"
            type="text"
            required
            value={form.client_id}
            onChange={handleChange}
            placeholder="1234567890"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Lo encontras en{" "}
            <a
              href="https://developers.mercadolibre.com.ar/devcenter"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ML Dev Center
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="client_secret"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Secret Key (Client Secret)
          </label>
          <input
            id="client_secret"
            name="client_secret"
            type="password"
            required
            value={form.client_secret}
            onChange={handleChange}
            placeholder="••••••••••••••••"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label
            htmlFor="redirect_uri"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Redirect URI
          </label>
          <input
            id="redirect_uri"
            name="redirect_uri"
            type="url"
            required
            value={form.redirect_uri}
            onChange={handleChange}
            placeholder="https://tu-dominio.com/api/auth/callback"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Debe coincidir exactamente con la URI registrada en ML Dev Center.
          </p>
        </div>

        <div>
          <label
            htmlFor="notifications_url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            URL de notificaciones
          </label>
          <input
            id="notifications_url"
            name="notifications_url"
            type="url"
            value={form.notifications_url}
            onChange={handleChange}
            placeholder="https://tu-dominio.com/api/notifications"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            ML envía webhooks aquí cuando hay cambios en órdenes, pagos, etc. Debe ser HTTPS.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Guardar App"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
