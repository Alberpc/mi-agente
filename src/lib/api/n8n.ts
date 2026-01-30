import type { N8NPayload, N8NResponse } from "../../types/chat";

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  console.warn(
    "VITE_N8N_WEBHOOK_URL no está definida. Crea un archivo .env con VITE_N8N_WEBHOOK_URL=tu_url"
  );
}

export async function sendToN8N(payload: N8NPayload): Promise<N8NResponse> {
  if (!WEBHOOK_URL) {
    return {
      success: false,
      error: "URL del webhook no configurada (VITE_N8N_WEBHOOK_URL)",
    };
  }

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as N8NResponse;

    if (!response.ok) {
      return {
        success: false,
        error: data.error ?? `HTTP ${response.status}`,
      };
    }

    return data;
  }

  if (contentType.includes("audio")) {
    const blob = await response.blob();

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const audioUrl = URL.createObjectURL(blob);

    return {
      success: true,
      data: {
        content: undefined,
        audio: audioUrl,
      },
    };
  }

  return {
    success: false,
    error: `Respuesta no reconocida: ${contentType || "(sin Content-Type)"}`,
  };
}
