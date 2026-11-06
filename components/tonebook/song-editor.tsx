import { useState, type FormEvent } from "react";
import { repertoireConfig } from "@/config/repertoire";
import { delayConfigurations, reverbConfigurations } from "@/config/tonebook";
import type { DelayConfigurationId, Preset, ReverbConfigurationId } from "@/types/tonebook";
import type { EffectState, Song, SongPart } from "@/types/repertoire";
import styles from "./repertoire.module.css";

export function createPart(): SongPart {
  return {
    id: crypto.randomUUID(), name: "", presetId: "",
    effects: { overdrive: "unspecified", delay: "unspecified", reverb: "unspecified" },
    configurations: { delay: "", reverb: "" },
    notes: "",
  };
}

interface SongEditorProps {
  song: Song;
  presets: readonly Preset[];
  onSave: (song: Song) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function SongEditor({ song, presets, onSave, onCancel, saving = false }: SongEditorProps) {
  const [draft, setDraft] = useState(song);
  const updatePart = (id: string, changes: Partial<SongPart>) => {
    setDraft((current) => ({
      ...current, parts: current.parts.map((part) => part.id === id ? { ...part, ...changes } : part),
    }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...draft, title: draft.title.trim(), artist: draft.artist.trim(),
      parts: draft.parts.map((part) => ({ ...part, name: part.name.trim(), notes: part.notes.trim() })),
    });
  };

  return (
    <form className={styles.editor} onSubmit={submit} aria-busy={saving}>
      <fieldset className={styles["form-fields"]} disabled={saving}>
      <h4>{song.title ? "Editar música" : "Nova música"}</h4>
      <div className={styles.fields}>
        <label>Música<input required autoFocus maxLength={150} pattern=".*\S.*" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Nome da música" /></label>
        <label>Artista<input maxLength={150} value={draft.artist} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} placeholder="Banda ou artista" /></label>
      </div>
      <datalist id="song-part-suggestions">
        {repertoireConfig.partSuggestions.map((name) => <option key={name} value={name} />)}
      </datalist>
      {draft.parts.map((part, index) => (
        <fieldset className={styles["part-editor"]} key={part.id}>
          <legend>Trecho {String(index + 1).padStart(2, "0")}</legend>
          <div className={styles.fields}>
            <label>Parte da música<input required maxLength={80} pattern=".*\S.*" list="song-part-suggestions" value={part.name} onChange={(event) => updatePart(part.id, { name: event.target.value })} placeholder="Intro, refrão, ponte…" /></label>
            <label>Preset da Tank-G
              <select value={part.presetId} onChange={(event) => {
                const preset = presets.find(({ id }) => id === event.target.value);
                updatePart(part.id, {
                  presetId: event.target.value,
                  effects: {
                    overdrive: preset?.od ? "on" : "unspecified",
                    delay: preset?.ambience ? "on" : "unspecified",
                    reverb: preset?.ambience ? "on" : "unspecified",
                  },
                  configurations: {
                    delay: preset?.delayConfigurationId ?? (part.configurations.delay || (preset?.ambience ? "delay-1" : "")),
                    reverb: preset?.reverbConfigurationId ?? (part.configurations.reverb || (preset?.ambience ? "reverb-1" : "")),
                  },
                });
              }}>
                <option value="">A definir</option>
                {part.presetId && !presets.some(({ id }) => id === part.presetId) && <option value={part.presetId}>{part.presetId} · Indisponível</option>}
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.id} · {preset.name}</option>)}
              </select>
              <span className={styles.hint}>Preenche os efeitos de referência; ajuste-os abaixo.</span>
            </label>
          </div>
          <div className={styles["effect-fields"]}>
            {repertoireConfig.effects.map((effect) => (
              <label key={effect.id}>{effect.label}<span className={styles.hint}>{effect.model}</span>
                {effect.id === "overdrive" ? (
                  <select value={part.effects.overdrive} onChange={(event) => updatePart(part.id, {
                    effects: { ...part.effects, overdrive: event.target.value as EffectState },
                  })}>
                    {repertoireConfig.states.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
                  </select>
                ) : (
                  <select
                    value={part.effects[effect.id] === "on" ? part.configurations[effect.id] || "on" : part.effects[effect.id]}
                    onChange={(event) => {
                      const value = event.target.value;
                      const isConfiguration = value !== "off" && value !== "unspecified";
                      updatePart(part.id, {
                        effects: { ...part.effects, [effect.id]: isConfiguration ? "on" : value as EffectState },
                        configurations: isConfiguration ? {
                          ...part.configurations,
                          [effect.id]: value as DelayConfigurationId | ReverbConfigurationId,
                        } : part.configurations,
                      });
                    }}
                  >
                    <option value="unspecified">A definir</option>
                    <option value="off">Desligado</option>
                    {part.effects[effect.id] === "on" && !part.configurations[effect.id] && <option value="on" disabled>Ligado · Configuração a definir</option>}
                    {(effect.id === "delay" ? delayConfigurations : reverbConfigurations).map((configuration) => (
                      <option key={configuration.id} value={configuration.id}>{configuration.label}{configuration.controls === null ? " · Valores pendentes" : ""}</option>
                    ))}
                  </select>
                )}
              </label>
            ))}
          </div>
          <label>Anotações<textarea maxLength={1500} rows={2} value={part.notes} onChange={(event) => updatePart(part.id, { notes: event.target.value })} placeholder="Captador, entrada do efeito, dinâmica…" /></label>
          <div className={styles["part-actions"]}>
            <button type="button" disabled={index === 0} aria-label={`Mover trecho ${index + 1} para cima`} onClick={() => {
              const parts = [...draft.parts];
              [parts[index - 1], parts[index]] = [parts[index], parts[index - 1]];
              setDraft({ ...draft, parts });
            }}>↑ Subir</button>
            <button type="button" disabled={index === draft.parts.length - 1} aria-label={`Mover trecho ${index + 1} para baixo`} onClick={() => {
              const parts = [...draft.parts];
              [parts[index + 1], parts[index]] = [parts[index], parts[index + 1]];
              setDraft({ ...draft, parts });
            }}>↓ Descer</button>
            <button type="button" disabled={draft.parts.length === 1} aria-label={`Remover trecho ${index + 1}`} onClick={() => setDraft({ ...draft, parts: draft.parts.filter(({ id }) => id !== part.id) })}>Remover trecho</button>
          </div>
        </fieldset>
      ))}
      <button type="button" className={styles.secondary} onClick={() => setDraft({ ...draft, parts: [...draft.parts, createPart()] })}>+ Adicionar trecho</button>
      <div className={styles["form-actions"]}>
        <button type="button" className={styles.secondary} onClick={onCancel}>Cancelar</button>
        <button className={styles.primary} type="submit">{saving ? "Salvando…" : "Salvar música"}</button>
      </div>
      </fieldset>
    </form>
  );
}
