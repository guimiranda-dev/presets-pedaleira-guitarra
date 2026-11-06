import { beforeEach, describe, expect, it, vi } from "vitest";
const { getDatabase, timestamp } = vi.hoisted(() => ({ getDatabase: vi.fn(), timestamp: vi.fn(() => "server-time") }));
vi.mock("@/lib/server/firestore", () => ({ getRepertoireDatabase: getDatabase }));
vi.mock("@google-cloud/firestore", () => ({ FieldValue: { serverTimestamp: timestamp } }));
import { listSongs, storeSong } from "@/lib/server/repertoire";
import { song } from "./fixtures";

type Row = { data: Record<string, unknown>; version: number };
const rows = new Map<string, Row>();
let clock = 0;
function snapshot(path: string) {
  const row = rows.get(path);
  return { id: path.split("/").at(-1), exists: !!row,
    updateTime: row ? { seconds: row.version, nanoseconds: 0 } : undefined,
    data: () => row?.data, get: (field: string) => row?.data[field] };
}
function collection(path: string) {
  return {
    doc: (id: string) => ({ path: `${path}/${id}`, collection: (name: string) => collection(`${path}/${id}/${name}`), get: async () => snapshot(`${path}/${id}`) }),
    orderBy: () => ({ get: async () => ({ docs: [...rows.keys()].filter((key) => key.startsWith(`${path}/`)).map(snapshot) }) }),
  };
}
beforeEach(() => {
  rows.clear(); clock = 0;
  getDatabase.mockReturnValue({
    collection,
    runTransaction: async (callback: (transaction: unknown) => Promise<void>) => {
      const writes: { path: string; data: Record<string, unknown> }[] = [];
      await callback({ get: async (ref: { path: string }) => snapshot(ref.path), set: (ref: { path: string }, data: Record<string, unknown>) => writes.push({ path: ref.path, data }) });
      writes.forEach(({ path, data }) => rows.set(path, { data, version: ++clock }));
    },
  });
});

describe("persistência do repertório", () => {
  it("começa vazio e não cria músicas automaticamente", async () => {
    expect(await listSongs("owner")).toEqual([]);
    expect(rows.size).toBe(0);
  });
  it("salva e lê somente no caminho do usuário autenticado", async () => {
    const saved = await storeSong("owner", song(), null);
    expect(saved.revision).toBe("1:0");
    expect((await listSongs("owner"))[0]).toEqual(saved);
    expect(await listSongs("other-user")).toEqual([]);
    expect(rows.has("users/owner/songs/test-song")).toBe(true);
  });
  it("atualiza mantendo a data de criação e sem persistir a revisão no conteúdo", async () => {
    const saved = await storeSong("owner", song(), null);
    const updated = await storeSong("owner", { ...song(), title: "Atualizada" }, saved.revision!);
    expect(updated.title).toBe("Atualizada");
    expect(updated.revision).toBe("2:0");
    expect(rows.get("users/owner/songs/test-song")?.data.createdAt).toBe("server-time");
    expect(rows.get("users/owner/songs/test-song")?.data).not.toHaveProperty("revision");
  });
  it("não sobrescreve edições concorrentes ou documentos existentes sem revisão", async () => {
    const first = await storeSong("owner", song(), null);
    await storeSong("owner", { ...song(), title: "Outra aba" }, first.revision!);
    await expect(storeSong("owner", song(), first.revision!)).rejects.toMatchObject({ status: 409 });
    await expect(storeSong("owner", song(), null)).rejects.toMatchObject({ status: 409 });
    expect((await listSongs("owner"))[0].title).toBe("Outra aba");
  });
});
