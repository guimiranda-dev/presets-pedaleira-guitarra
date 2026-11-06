"use client";

import { useState } from "react";
import type { AuthUser } from "@/types/auth";
import { useEmailAuth } from "@/hooks/use-email-auth";
import { EmailLogin } from "./email-login";
import { useCloudRepertoire } from "@/hooks/use-cloud-repertoire";
import { repertoireConfig } from "@/config/repertoire";
import { delayConfigurations, reverbConfigurations } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import type { Song } from "@/types/repertoire";
import { createPart, SongEditor } from "./song-editor";
import styles from "./repertoire.module.css";

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

interface RepertoireProps {
  presets: readonly Preset[];
  onSelectPreset: (id: string) => void;
}

export function Repertoire(props: RepertoireProps) {
  const auth = useEmailAuth();
  if (auth.user && !auth.loading) {
    return <RepertoireContent key={auth.user.uid} {...props} user={auth.user} onLogout={auth.logout} authBusy={auth.busy} authError={auth.error} />;
  }
  return (
    <section id="repertoire" className={styles.section} aria-labelledby="repertoire-title">
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}>DO ENSAIO AO PALCO</span><h3 id="repertoire-title">Cada música, seu caminho.</h3><p>Seu repertório pessoal, disponível onde você for tocar.</p></div>
      </div>
      <EmailLogin auth={auth} />
    </section>
  );
}

function RepertoireContent({ presets, onSelectPreset, user, onLogout, authBusy, authError }: RepertoireProps & {
  user: AuthUser;
  onLogout: () => Promise<void>;
  authBusy: boolean;
  authError: string;
}) {
  const { songs, loading, loadError, saveSong, reload } = useCloudRepertoire(user);
  const [selectedId, setSelectedId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Song | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = songs.filter((song) => normalize(`${song.title} ${song.artist}`).includes(normalize(query)));
  const selected = visible.find(({ id }) => id === selectedId) ?? visible[0];

  async function save(song: Song) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await saveSong(song);
      setSelectedId(song.id);
      setQuery("");
      setDraft(null);
      setMessage(`“${song.title}” salva no seu repertório.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar. Seu formulário foi mantido; tente novamente.");
    } finally { setSaving(false); }
  }

  return (
    <section id="repertoire" className={styles.section} aria-labelledby="repertoire-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>DO ENSAIO AO PALCO</span>
          <h3 id="repertoire-title">Cada música, seu caminho.</h3>
          <p>Organize os timbres de cada parte e saiba o que ligar na próxima entrada.</p>
        </div>
        <button type="button" className={styles.primary} onClick={() => {
          setError("");
          setMessage("");
          setDraft({ id: crypto.randomUUID(), title: "", artist: "", parts: [{ ...createPart(), name: "Intro" }] });
        }} disabled={draft !== null || loading || !!loadError}>+ Nova música</button>
      </div>
      <div className={styles["account-bar"]}>
        <span>{user.email}</span>
        <span><button type="button" className={styles.secondary} onClick={reload} disabled={loading || saving || draft !== null}>Atualizar</button> <button type="button" className={styles.secondary} onClick={onLogout} disabled={authBusy || saving}>Sair</button></span>
      </div>
      {authError && <p role="alert" className={styles.warning}>{authError}</p>}
      {loadError && <p role="alert" className={styles.warning}>{loadError}</p>}
      {loading && <p role="status" className={styles.empty}>Carregando repertório…</p>}
      <div className={styles.workspace}>
        <aside className={styles.library} aria-label="Músicas do repertório">
          <div className={styles["library-top"]}><span>MEU REPERTÓRIO</span><b>{String(songs.length).padStart(2, "0")}</b></div>
          <input type="search" className={styles.search} aria-label="Buscar músicas" placeholder="Buscar música ou artista…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className={styles["song-list"]}>
            {visible.map((song, index) => (
              <button type="button" key={song.id} disabled={draft !== null || saving} className={`${styles.song} ${selected?.id === song.id ? styles.selected : ""}`} aria-pressed={selected?.id === song.id} onClick={() => { setSelectedId(song.id); setMessage(""); }}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{song.title}</strong><small>{song.artist || "Artista não informado"}</small></span>
                <span className={styles["part-count"]}>{song.parts.length} {song.parts.length === 1 ? "parte" : "partes"}</span>
              </button>
            ))}
            {!loading && !loadError && !visible.length && <p className={styles.empty} role="status">{songs.length ? "Nenhuma música encontrada." : "Seu próximo som começa com uma nova música."}</p>}
          </div>
          <p className={styles["storage-note"]}>Suas músicas ficam salvas na sua conta.</p>
        </aside>
        <div className={styles.detail}>
          {error && <p className={styles.warning} role="alert">{error}</p>}
          {draft ? <SongEditor key={draft.id} song={draft} presets={presets} onSave={save} saving={saving} onCancel={() => { setDraft(null); setError(""); }} /> : selected ? (
            <>
              <div className={styles["song-heading"]}>
                <div><span className={styles.eyebrow}>ROTEIRO DE TIMBRES</span><h4>{selected.title}</h4><p>{selected.artist || "Artista não informado"}</p></div>
                <button type="button" className={styles.secondary} onClick={() => { setDraft(selected); setMessage(""); }}>Editar música</button>
              </div>
              <ol className={styles.timeline}>
                {selected.parts.map((part, index) => {
                  const preset = presets.find(({ id }) => id === part.presetId);
                  return (
                    <li className={styles.part} key={part.id}>
                      <span className={styles.step}>{String(index + 1).padStart(2, "0")}</span>
                      <div className={styles["part-content"]}>
                        <div className={styles["part-heading"]}>
                          <h5>{part.name}</h5>
                          {preset ? <button type="button" className={styles["preset-link"]} onClick={() => onSelectPreset(preset.id)} aria-label={`Consultar preset ${preset.id}, ${preset.name}, para ${part.name}`}>{preset.id} · {preset.name} <span aria-hidden="true">↗</span></button>
                            : <span className={styles.unassigned}>{part.presetId ? `${part.presetId} · Preset indisponível` : "Preset a definir"}</span>}
                        </div>
                        <div className={styles.effects}>
                          {repertoireConfig.effects.map((effect) => {
                            const configuration = effect.id === "overdrive" ? undefined
                              : (effect.id === "delay" ? delayConfigurations : reverbConfigurations)
                                .find(({ id }) => id === part.configurations[effect.id as "delay" | "reverb"]);
                            const active = part.effects[effect.id] === "on";
                            return (
                              <span key={effect.id} className={`${styles.effect} ${styles[part.effects[effect.id]]}`}>
                                <i aria-hidden="true" />{active && configuration ? configuration.label : effect.label}
                                <span>{repertoireConfig.states.find(({ value }) => value === part.effects[effect.id])?.label}</span>
                                {active && configuration?.controls === null && <span className={styles["pending-configuration"]}>Valores pendentes</span>}
                              </span>
                            );
                          })}
                        </div>
                        {part.notes && <p className={styles.notes}>{part.notes}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className={styles.legend}><span><i className={styles["on-dot"]} />Ligado</span><span><i className={styles["off-dot"]} />Desligado</span><span>Você decide o timbre de cada trecho.</span></div>
            </>
          ) : <div className={styles.empty}>{loading ? "Buscando suas músicas…" : loadError ? "O repertório está indisponível. Tente atualizar." : "Adicione sua primeira música para montar o roteiro de timbres."}</div>}
        </div>
      </div>
      <p role="status" className={styles["save-message"]}>{message}</p>
    </section>
  );
}
