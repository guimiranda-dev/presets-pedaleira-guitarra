import { requireUser } from "@/lib/server/auth";
import { errorResponse, HttpError, json } from "@/lib/server/errors";
import { storeSong } from "@/lib/server/repertoire";
import { saveSongSchema, songIdSchema } from "@/lib/repertoire-schema";

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Envie os dados da música.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 512_000) {
        await reader.cancel();
        throw new HttpError(413, "A música excede o tamanho permitido.");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "O conteúdo enviado não é um JSON válido.");
  } finally {
    reader.releaseLock();
  }
}

export async function PUT(request: Request, context: { params: Promise<{ songId: string }> }) {
  try {
    const user = await requireUser(request);
    const { songId } = await context.params;
    if (!songIdSchema.safeParse(songId).success) throw new HttpError(400, "Identificador de música inválido.");
    const parsed = saveSongSchema.safeParse(await readBody(request));
    if (!parsed.success || parsed.data.song.id !== songId) throw new HttpError(400, "Confira os campos e os trechos da música.");
    return json({ song: await storeSong(user.uid, parsed.data.song, parsed.data.revision) });
  } catch (error) {
    return errorResponse(error);
  }
}
