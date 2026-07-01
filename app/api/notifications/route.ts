// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * MercadoLibre envía notificaciones (webhooks) a esta URL.
 *
 * ML hace GET para verificar el endpoint (debe responder 200).
 * ML hace POST con el payload de la notificación.
 *
 * Formato del payload:
 * {
 *   _id: string,
 *   resource: string,      // ej: "/orders/123456"
 *   user_id: number,       // ML user ID del vendedor
 *   topic: string,         // ej: "orders_v2", "payments", "questions", "items"
 *   application_id: number,
 *   attempts: number,
 *   sent: string,          // ISO timestamp
 *   received: string       // ISO timestamp
 * }
 *
 * ML espera respuesta 200 dentro de 500ms, luego reintenta con backoff.
 */

export async function GET() {
  // ML usa GET para verificar que el endpoint existe y responde
  return new NextResponse("OK", { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { topic, resource, user_id, application_id } = body as {
      _id?: string;
      topic?: string;
      resource?: string;
      user_id?: number;
      application_id?: number;
      attempts?: number;
      sent?: string;
      received?: string;
    };

    console.log(`[ML Notification] topic=${topic} resource=${resource} user=${user_id} app=${application_id}`);

    // Responder 200 inmediatamente — ML reintenta si no recibe respuesta rápida
    // Procesar de forma async según el topic
    switch (topic) {
      case "orders_v2":
        // TODO: procesar orden
        break;
      case "payments":
        // TODO: procesar pago
        break;
      case "questions":
        // TODO: procesar pregunta
        break;
      case "items":
        // TODO: procesar cambio de item
        break;
      case "shipments":
        // TODO: procesar envío
        break;
      default:
        console.log(`[ML Notification] topic desconocido: ${topic}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[ML Notification] Error procesando notificación:", error);
    // Devolver 200 igual — si devolvemos 5xx ML seguirá reintentando indefinidamente
    return new NextResponse(null, { status: 200 });
  }
}
