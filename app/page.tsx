// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          MercadoLibre OAuth Core
        </h1>
        <p className="text-gray-500 text-lg max-w-md">
          Plataforma centralizada para gestionar apps y tokens OAuth de
          MercadoLibre.
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <Link
          href="/dashboard"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Ir al Dashboard
        </Link>
        <Link
          href="/apps"
          className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Gestionar Apps
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-1">Apps registradas</h3>
          <p className="text-sm text-gray-500">
            Guarda las credenciales client_id / client_secret de cada app de ML.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-1">Flujo OAuth 2.0</h3>
          <p className="text-sm text-gray-500">
            Authorization Code Flow completo con soporte de refresh token
            automático.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-1">Tokens centralizados</h3>
          <p className="text-sm text-gray-500">
            Almacena y monitorea el estado de cada token con su fecha de
            expiración.
          </p>
        </div>
      </div>
    </div>
  );
}
