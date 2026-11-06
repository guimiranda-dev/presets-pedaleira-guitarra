import { describe, expect, it } from "vitest";
import { saveSongSchema, songSchema } from "@/lib/repertoire-schema";
import { song } from "./fixtures";

describe("contrato das músicas no Firestore", () => {
  it("preserva trechos, efeitos e configurações independentes", () => {
    expect(songSchema.parse(song())).toEqual(song());
  });
  it("não aceita credenciais ou campos extras no documento", () => {
    expect(songSchema.safeParse({ ...song(), uid: "another-user" }).success).toBe(false);
  });
  it("recusa identificadores que poderiam alterar caminhos", () => {
    expect(songSchema.safeParse({ ...song(), id: "../other/song" }).success).toBe(false);
  });
  it("recusa música vazia, sem trechos e trechos duplicados", () => {
    expect(songSchema.safeParse({ ...song(), title: "   " }).success).toBe(false);
    expect(songSchema.safeParse({ ...song(), parts: [] }).success).toBe(false);
    expect(songSchema.safeParse({ ...song(), parts: [song().parts[0], song().parts[0]] }).success).toBe(false);
  });
  it("recusa presets desconhecidos e configurações removidas", () => {
    const data = song();
    data.parts[0].presetId = "99Z";
    expect(songSchema.safeParse(data).success).toBe(false);
    expect(songSchema.safeParse({ ...song(), parts: [{ ...song().parts[0], configurations: { delay: "delay-3", reverb: "reverb-1" } }] }).success).toBe(false);
  });
  it("exige revisão nula na criação ou revisão válida na edição", () => {
    expect(saveSongSchema.safeParse({ song: song(), revision: null }).success).toBe(true);
    expect(saveSongSchema.safeParse({ song: song(), revision: "1:2" }).success).toBe(true);
    expect(saveSongSchema.safeParse({ song: song() }).success).toBe(false);
  });
});
