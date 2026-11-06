import "server-only";
import { z } from "zod";
import { HttpError } from "./errors";

export const emailSchema = z.object({ email: z.email().max(254).transform((email) => email.toLowerCase()) }).strict();
export const codeSchema = emailSchema.extend({ code: z.string().regex(/^\d{6}$/) });

export async function readAuthBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Preencha os campos para continuar.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) { await reader.cancel(); throw new HttpError(413, "Conteúdo enviado muito grande."); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Dados inválidos.");
  } finally { reader.releaseLock(); }
}
