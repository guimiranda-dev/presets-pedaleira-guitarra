import "server-only";
import { FieldValue, type DocumentSnapshot } from "@google-cloud/firestore";
import { getRepertoireDatabase } from "./firestore";
import { songSchema } from "@/lib/repertoire-schema";
import type { Song } from "@/types/repertoire";
import { HttpError } from "./errors";

function songsFor(uid: string) {
  return getRepertoireDatabase().collection("users").doc(encodeURIComponent(uid)).collection("songs");
}

function revision(snapshot: DocumentSnapshot) {
  return snapshot.updateTime ? `${snapshot.updateTime.seconds}:${snapshot.updateTime.nanoseconds}` : null;
}

function deserialize(snapshot: DocumentSnapshot): Song {
  const data = snapshot.data();
  const parsed = songSchema.safeParse({
    id: snapshot.id, title: data?.title, artist: data?.artist, parts: data?.parts,
  });
  if (!parsed.success) throw new HttpError(503, "Uma música salva tem dados incompatíveis. Contate o responsável pela aplicação.");
  return { ...parsed.data, revision: revision(snapshot) ?? undefined };
}

export async function listSongs(uid: string) {
  const result = await songsFor(uid).orderBy("createdAt", "asc").get();
  return result.docs.map(deserialize);
}

export async function storeSong(uid: string, song: Song, expectedRevision: string | null) {
  const db = getRepertoireDatabase();
  const ref = songsFor(uid).doc(song.id);
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (revision(existing) !== expectedRevision) {
      throw new HttpError(409, "Esta música mudou em outra aba ou dispositivo. Suas alterações foram mantidas no formulário. Copie-as antes de cancelar e reabrir a versão atualizada.");
    }
    transaction.set(ref, {
      ...songSchema.parse(song),
      schemaVersion: 1,
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return deserialize(await ref.get());
}
