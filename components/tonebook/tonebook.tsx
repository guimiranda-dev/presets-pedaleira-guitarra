"use client";

import { useState } from "react";
import { siteConfig } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import { Pedalboard } from "./pedalboard";
import { PresetDetail } from "./preset-detail";
import { Repertoire } from "./repertoire";
import styles from "./tonebook.module.css";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function Tonebook({ presets }: { presets: readonly Preset[] }) {
  const [selectedId, setSelectedId] = useState(presets[0]?.id);
  const [bank, setBank] = useState("all");
  const [query, setQuery] = useState("");
  const banks = [...new Set(presets.map((preset) => preset.id.slice(0, -1)))];
  const filters = [
    { id: "all", label: "Todos os presets" },
    ...banks.map((id) => ({ id, label: `Banco ${id}` })),
  ];
  const search = normalize(query);
  const visiblePresets = presets.filter((preset) =>
    (bank === "all" || preset.id.slice(0, -1) === bank) &&
    normalize(`${preset.name} ${preset.id} ${preset.song ?? ""} ${preset.artist ?? ""}`)
      .includes(search),
  );
  const selected = visiblePresets.find((preset) => preset.id === selectedId)
    ?? visiblePresets[0];

  return (
    <div className={styles.page}>
      <header>
        <div className={styles.brand}>
          <b aria-hidden="true">≋</b>{siteConfig.name}
          <span className={styles["brand-dot"]}>.</span>
        </div>
        <span className={styles["header-note"]}>{siteConfig.tagline}</span>
      </header>
      <main>
        <div className={styles.intro}>
          <div>
            <div className={styles.eyebrow}>GUITARRA / BIBLIOTECA PESSOAL</div>
            <h1>{siteConfig.heading}</h1>
            <p className={styles.sub}>{siteConfig.subtitle}</p>
          </div>
          <div className={styles.count}>
            {String(presets.length).padStart(2, "0")} PRESETS · {String(banks.length).padStart(2, "0")} BANCOS
          </div>
        </div>
        <nav className={styles["section-nav"]} aria-label="Seções da página">
          <a href="#preset-library">01 / Presets</a>
          <a href="#pedalboard">02 / Pedalboard</a>
          <a href="#repertoire">03 / Repertório <span aria-hidden="true">↓</span></a>
        </nav>
        <div className={styles.toolbar} role="group" aria-label="Filtrar presets">
          {filters.map((filter) => (
            <button
              type="button"
              className={`${styles.tab} ${bank === filter.id ? styles.active : ""}`}
              aria-pressed={bank === filter.id}
              onClick={() => setBank(filter.id)}
              key={filter.id}
            >
              {filter.label}
            </button>
          ))}
          <input
            className={styles.search}
            aria-label="Buscar presets"
            placeholder="⌕  Buscar um timbre…"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.layout} id="preset-library" role="region" aria-label="Biblioteca de presets" tabIndex={-1}>
          <aside aria-label="Lista de presets">
            <div className={styles.list}>
              {visiblePresets.map((preset) => (
                <button
                  type="button"
                  className={`${styles.preset} ${selected?.id === preset.id ? styles.selected : ""}`}
                  key={preset.id}
                  aria-pressed={selected?.id === preset.id}
                  onClick={() => setSelectedId(preset.id)}
                >
                  <span className={styles.code}>{preset.id}</span>
                  <span>
                    <strong>{preset.name}</strong>
                    <small>{preset.pickup} · {preset.type}</small>
                  </span>
                </button>
              ))}
              {visiblePresets.length === 0 && (
                <p className={styles.empty} role="status">Nenhum preset encontrado.</p>
              )}
            </div>
            <p className={styles["aside-note"]}>
              UM TIMBRE, UMA INTENÇÃO<br /><br />
              Selecione um preset para consultar a cadeia de sinal e os ajustes.
            </p>
          </aside>
          <section
            className={styles.detail}
            aria-live="polite"
            aria-atomic="true"
            aria-labelledby={selected ? "preset-title" : undefined}
            aria-label={selected ? undefined : "Detalhes do preset"}
          >
            {selected ? <PresetDetail preset={selected} /> : (
              <p className={styles.empty}>
                Selecione outro banco ou ajuste sua busca para encontrar um timbre.
              </p>
            )}
          </section>
        </div>
        <Pedalboard preset={selected} />
        <Repertoire presets={presets} onSelectPreset={(id) => {
          setBank("all");
          setQuery("");
          setSelectedId(id);
          const library = document.getElementById("preset-library");
          library?.scrollIntoView({ block: "start" });
          library?.focus({ preventScroll: true });
        }} />
        <footer>
          <span>{siteConfig.name}. · Feito para tocar mais.</span>
          <span>O próximo timbre começa aqui.</span>
        </footer>
      </main>
    </div>
  );
}
