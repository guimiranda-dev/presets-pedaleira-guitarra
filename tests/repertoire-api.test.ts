import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), listSongs: vi.fn(), storeSong: vi.fn() }));
vi.mock("@/lib/server/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/server/repertoire", () => ({ listSongs: mocks.listSongs, storeSong: mocks.storeSong }));
import { GET } from "@/app/api/repertoire/route";
import { PUT } from "@/app/api/repertoire/songs/[songId]/route";
import { HttpError } from "@/lib/server/errors";
import { song } from "./fixtures";
const context = { params: Promise.resolve({ songId: "test-song" }) };
const request = (body: unknown) => new Request("http://localhost/api/repertoire/songs/test-song", { method: "PUT", body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ uid: "owner" });
  mocks.listSongs.mockResolvedValue([]);
  mocks.storeSong.mockResolvedValue({ ...song(), revision: "1:0" });
});
describe("API do repertório", () => {
  it("responde 401 sem consultar músicas quando não há sessão", async () => {
    mocks.requireUser.mockRejectedValue(new HttpError(401, "Entre"));
    const response = await GET(new Request("http://localhost/api/repertoire"));
    expect(response.status).toBe(401);
    expect(mocks.listSongs).not.toHaveBeenCalled();
  });
  it("retorna a lista vazia sem cache", async () => {
    const response = await GET(new Request("http://localhost/api/repertoire"));
    expect(await response.json()).toEqual({ songs: [] });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("valida o documento antes de gravar", async () => {
    const response = await PUT(request({ song: { ...song(), title: "" }, revision: null }), context);
    expect(response.status).toBe(400);
    expect(mocks.storeSong).not.toHaveBeenCalled();
  });
  it("recusa id diferente do caminho e JSON inválido", async () => {
    expect((await PUT(request({ song: { ...song(), id: "other" }, revision: null }), context)).status).toBe(400);
    expect((await PUT(new Request("http://localhost/api/repertoire", { method: "PUT", body: "not-json" }), context)).status).toBe(400);
  });
  it("limita o corpo antes de processar o documento", async () => {
    const response = await PUT(new Request("http://localhost/api/repertoire", { method: "PUT", body: "x".repeat(512_001) }), context);
    expect(response.status).toBe(413);
  });
  it("usa somente o uid verificado e preserva o conflito 409", async () => {
    expect((await PUT(request({ song: song(), revision: null }), context)).status).toBe(200);
    expect(mocks.storeSong).toHaveBeenCalledWith("owner", song(), null);
    mocks.storeSong.mockRejectedValue(new HttpError(409, "Conflito"));
    expect((await PUT(request({ song: song(), revision: "1:0" }), context)).status).toBe(409);
  });
});
