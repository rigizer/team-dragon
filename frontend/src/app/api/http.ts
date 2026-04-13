function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => null);
}

function extractMessageFromBody(body: unknown): string | null {
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) {
      return null;
    }

    // FastAPI/Starlette stack traces are not actionable in the UI.
    if (trimmed.startsWith("Traceback")) {
      return null;
    }

    return trimmed;
  }

  if (!isRecord(body)) {
    return null;
  }

  const detail = body.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const message = body.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "요청 처리에 실패했습니다."
): Promise<T> {
  const response = await fetch(input, init);
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const message = extractMessageFromBody(body) ?? `${fallbackMessage} (${response.status})`;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toMessage(value: unknown): string | null {
  return extractMessageFromBody(value);
}

export function toRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}
