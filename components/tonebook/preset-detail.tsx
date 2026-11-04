import { Fragment } from "react";
import { amplifierConfig } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import { Knob } from "./knob";
import styles from "./tonebook.module.css";

export function PresetDetail({ preset }: { preset: Preset }) {
  const chain = [
    { label: "CAPTADOR", value: preset.pickup },
    { label: "OVERDRIVE", value: preset.od ? "Ligado" : "Não especificado" },
    { label: "AMPLIFICADOR", value: preset.amp },
    { label: "IMPULSE RESPONSE", value: preset.ir },
  ];

  return (
    <>
      <div className={styles["detail-head"]}>
        <div>
          <span className={styles.tag}>BANCO {preset.id.slice(0, -1)} / {preset.type.toUpperCase()}</span>
          <h2 id="preset-title">{preset.name}</h2>
        </div>
        <span className={styles["big-code"]}>{preset.id}</span>
      </div>
      <p className={styles.description}>{preset.desc}</p>
      <div className={styles.reference}>
        <span>♫ &nbsp; REFERÊNCIA</span>
        {preset.song ? <>{preset.song} <span>— {preset.artist}</span></> : "Sem música de referência definida"}
      </div>
      <div className={styles.sectionlabel}>01 — CADEIA DE SINAL</div>
      <div className={styles.chain}>
        {chain.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <span className={styles.arrow} aria-hidden="true">→</span>}
            <div className={styles["chain-item"]}><small>{item.label}</small><strong>{item.value}</strong></div>
          </Fragment>
        ))}
      </div>
      <div className={styles.sectionlabel}>02 — AJUSTES DO AMPLIFICADOR · ESCALA {amplifierConfig.min}–{amplifierConfig.max}</div>
      <div className={styles.controls}>
        {amplifierConfig.labels.map((label, index) => (
          <Knob key={label} label={label} value={preset.values[index]} rotation={amplifierConfig.startAngle + ((preset.values[index] - amplifierConfig.min) / (amplifierConfig.max - amplifierConfig.min)) * amplifierConfig.sweepAngle} />
        ))}
      </div>
      {preset.ambience && <p className={styles["ambience-note"]}>● Reverb e delay ligados · Ajustes dos pedais pendentes.</p>}
    </>
  );
}
