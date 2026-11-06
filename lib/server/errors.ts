import "server-only";
import { unstable_rethrow } from "next/navigation";

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function logServiceError(service: string, error: unknown) {
  const value = error as { name?: unknown; code?: unknown; responseCode?: unknown; status?: unknown } | null;
  const safeCode = (code: unknown) => typeof code === "number" ? code
    : typeof code === "string" && /^[A-Z0-9_-]{1,40}$/i.test(code) ? code : undefined;
  console.error("Falha de serviço", {
    service,
    code: safeCode(value?.code),
    status: safeCode(value?.status),
    smtpStatus: safeCode(value?.responseCode),
  });
}

export function errorResponse(error: unknown) {
  unstable_rethrow(error);
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  // Só registra códigos de diagnóstico, nunca mensagens que possam conter segredos.
  logServiceError("api", error);
  const code = (error as { code?: unknown } | null)?.code;
  if (code === 7 || code === "PERMISSION_DENIED") {
    return json({ error: "A aplicação não tem permissão para acessar o banco. Confira as permissões da conta de serviço na GCP." }, 503);
  }
  if (code === 5 || code === "NOT_FOUND") {
    return json({ error: "O banco configurado não foi encontrado. Confira o projeto e o nome do banco." }, 503);
  }
  if (code === 16 || code === "UNAUTHENTICATED") {
    return json({ error: "As credenciais da GCP foram recusadas. Confira as credenciais do servidor." }, 503);
  }
  return json({ error: "Não foi possível acessar o repertório. Tente novamente." }, 503);
}
