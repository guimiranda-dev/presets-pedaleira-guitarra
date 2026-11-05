import { Fragment } from "react";
import { delayConfigurations, reverbConfigurations } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import { TankG } from "./tank-g";
import styles from "./tonebook.module.css";

export function PresetDetail({ preset }: { preset: Preset }) {
  const delay = delayConfigurations.find(({ id }) => id === (preset.delayConfigurationId ?? "delay-1"));
  const reverb = reverbConfigurations.find(({ id }) => id === (preset.reverbConfigurationId ?? "reverb-1"));
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
      <div className={styles.sectionlabel}>02 — AJUSTES DO AMPLIFICADOR · M-VAVE TANK-G</div>
      <TankG preset={preset} />
      {preset.ambience && <p className={styles["ambience-note"]}>
        ● {delay?.label} e {reverb?.label} ligados · {delay?.controls === null || reverb?.controls === null ? "Valores dos pedais pendentes." : "Consulte os ajustes no pedalboard."}
      </p>}
    </>
  );
}
