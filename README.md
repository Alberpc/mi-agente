# Asistente conversacional

Aplicación web mobile-first de asistente con texto y audio, conectada a un webhook n8n. Incluye avatar animado por estados (idle / thinking / speaking).

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto con la URL del webhook de n8n:

```env
VITE_N8N_WEBHOOK_URL=https://tu-dominio-n8n.com/webhook/xxx
```

## Avatar

Coloca los vídeos del avatar en `public/avatar/`:

- `idle.mp4` — estado esperando
- `thinking.mp4` — estado pensando (esperando respuesta)
- `speaking.mp4` — estado hablando (reproduciendo audio)

## Desarrollo

```bash
npm run dev
```

Abre la URL que muestra la terminal (por ejemplo `http://localhost:5173`).

## Build

```bash
npm run build
```

Los artefactos quedan en `dist/`.

## Contrato con n8n

**Request (POST JSON):**

```json
{
  "id": "string",
  "text": "string | null",
  "audio": "string | null"
}
```

**Response (JSON):**

```json
{
  "success": true,
  "data": {
    "content": "string",
    "audio": "string | null"
  }
}
```

La app soporta respuestas solo texto, solo audio o texto + audio. El audio se reproduce mediante el botón "▶ Reproducir respuesta" (sin autoplay).
