"use client";

import { useState } from "react";
import { delayConfigurations, delayControls, overdriveControls, pedalModels, reverbConfigurations, reverbControls } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import { Knob } from "./knob";
import styles from "./tonebook.module.css";
import gear from "./gear.module.css";

export function Pedalboard({ preset }: { preset?: Preset }) {
  const [delayId, setDelayId] = useState<string>(delayConfigurations[0].id);
  const [reverbId, setReverbId] = useState<string>(reverbConfigurations[0].id);
  const delay = delayConfigurations.find(({ id }) => id === delayId) ?? delayConfigurations[0];
  const reverb = reverbConfigurations.find(({ id }) => id === reverbId) ?? reverbConfigurations[0];
  const pedals = [
    { ...pedalModels.overdrive, skin: gear["pure-sky"], active: preset?.od, controls: overdriveControls, configuration: undefined, options: [], onChange: undefined },
    { ...pedalModels.delay, skin: gear.elemental, active: preset?.ambience, controls: delay.controls ?? delayControls.map(({ label }) => ({ label, value: "—" })), configuration: delay, options: delayConfigurations, onChange: setDelayId },
    { ...pedalModels.reverb, skin: gear["mini-universe"], active: preset?.ambience, controls: reverb.controls ?? reverbControls.map(({ label }) => ({ label, value: "—" })), configuration: reverb, options: reverbConfigurations, onChange: setReverbId },
  ];
  const status = !preset ? "Nenhum preset selecionado" : preset.ambience
    ? `${preset.id} · Delay e reverb ligados`
    : preset.od ? `${preset.id} · Overdrive ligado`
      : `${preset.id} · Ativação dos pedais não especificada`;

  return (
    <section id="pedalboard" className={styles.pedalsection} aria-labelledby="pedalboard-title">
      <div className={styles.pedalheading}>
        <div>
          <h3 id="pedalboard-title">Seu pedalboard</h3>
          <p className={styles.sub}>Os ajustes dos pedais, do jeito que você vê na sua frente.</p>
        </div>
        <span className={styles.tag}>CONFIGURAÇÃO DE REFERÊNCIA</span>
      </div>
      <div className={gear.board}>
        {pedals.map((pedal, index) => (
          <figure className={gear.unit} key={pedal.model}>
            <figcaption className={gear["unit-caption"]}>
              <span>0{index + 1} / {pedal.effect}</span>
              <strong>{pedal.brand} · {pedal.model}</strong>
            </figcaption>
            <div className={gear["configuration-picker"]}>
              {pedal.configuration ? <label>
                <span>Configuração de {pedal.effect.toLowerCase()}</span>
                <select value={pedal.configuration.id} onChange={(event) => pedal.onChange?.(event.target.value)}>
                  {pedal.options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.controls === null ? " · Pendente" : ""}</option>)}
                </select>
              </label> : <span>Ajustes de referência</span>}
            </div>
            <div className={`${gear.stomp} ${pedal.skin}`}>
              <div className={gear.jacks} aria-hidden="true"><span>OUT</span><span>IN</span></div>
              <div className={gear["stomp-controls"]}>
                {pedal.controls.map((control) => (
                  <Knob key={control.label} {...control} className={gear.control} />
                ))}
              </div>
              <div className={gear.wordmark}>
                <span>{pedal.brand}</span>
                <h4>{pedal.model}</h4>
                <small>{pedal.configuration?.controls === null ? "VALORES PENDENTES" : pedal.effect}</small>
              </div>
              <span
                className={`${gear.led} ${pedal.active ? gear.on : ""}`}
                role="img"
                aria-label={`${pedal.effect}: ${pedal.active ? "ligado" : "ativação não especificada"}`}
              />
              <div className={gear.footswitch} aria-hidden="true" />
              <span className={gear["switch-label"]}>{index === 1 ? "TAP / HOLD" : "TRUE BYPASS"}</span>
            </div>
          </figure>
        ))}
      </div>
      <div className={styles.statusrow}>
        <span aria-live="polite">{status}</span>
        <span>Posições dos botões em horas</span>
      </div>
    </section>
  );
}
