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
  const value = error as { name?: unknown; code?: unknown; responseCode?: unknown; status?: unknown; cause?: { code?: unknown }; response?: { status?: unknown; data?: { error?: unknown } } } | null;
  const safeCode = (code: unknown) => typeof code === "number" ? code
    : typeof code === "string" && /^[A-Z0-9_-]{1,40}$/i.test(code) ? code : undefined;
  console.error("Falha de serviço", {
    service,
    type: safeCode(value?.name),
    code: safeCode(value?.code),
    status: safeCode(value?.status ?? value?.response?.status),
    causeCode: safeCode(value?.cause?.code),
    reason: credentialFailure(error),
    smtpStatus: safeCode(value?.responseCode),
  });
}

function credentialFailure(error: unknown) {
  const value = error as { message?: unknown; response?: { data?: { error?: unknown } } } | null;
  const providerError = value?.response?.data?.error;
  if (["invalid_grant", "invalid_client", "unauthorized_client"].includes(String(providerError))) {
    return "GCP_CREDENTIALS_REJECTED";
  }
  const message = typeof value?.message === "string" ? value.message : "";
  if (/could not load the default credentials|default credentials were not found|no application default credentials/i.test(message)) {
    return "GCP_CREDENTIALS_MISSING";
  }
  return undefined;
}

export function errorResponse(error: unknown, service = "api") {
  unstable_rethrow(error);
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  // Só registra códigos de diagnóstico, nunca mensagens que possam conter segredos.
  logServiceError(service, error);
  const credentialIssue = credentialFailure(error);
  if (credentialIssue === "GCP_CREDENTIALS_MISSING") {
    return json({ error: "As credenciais da GCP não estão disponíveis neste servidor. Configure a conta de serviço ou as credenciais padrão na hospedagem." }, 503);
  }
  if (credentialIssue === "GCP_CREDENTIALS_REJECTED") {
    return json({ error: "A GCP recusou as credenciais do servidor. Confira se o e-mail da conta de serviço e a chave privada pertencem à mesma conta e continuam válidos." }, 503);
  }
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
