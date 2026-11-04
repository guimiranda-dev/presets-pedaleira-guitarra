import { overdriveControls } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import { Knob } from "./knob";
import styles from "./tonebook.module.css";

export function Pedalboard({ preset }: { preset?: Preset }) {
  const pedals = [
    { name: "Overdrive", caption: "UM POUCO MAIS DE COR", color: "", active: preset?.od },
    { name: "Delay", caption: "ESPAÇO ENTRE AS NOTAS", color: styles.blue, active: preset?.ambience },
    { name: "Reverb", caption: "DEIXE O SOM RESPIRAR", color: styles.tan, active: preset?.ambience },
  ];
  const status = !preset ? "Nenhum preset selecionado" : preset.ambience
    ? `${preset.id} · Delay e reverb ligados`
    : preset.od ? `${preset.id} · Overdrive ligado`
      : `${preset.id} · Ativação dos pedais não especificada`;

  return (
    <section className={styles.pedalsection} aria-labelledby="pedalboard-title">
      <div className={styles.pedalheading}>
        <div><h3 id="pedalboard-title">Seu pedalboard</h3><p className={styles.sub}>Os ajustes dos pedais, do jeito que você vê na sua frente.</p></div>
        <span className={styles.tag}>CONFIGURAÇÃO DE REFERÊNCIA</span>
      </div>
      <div className={styles.pedalgrid}>
        {pedals.map((pedal, index) => (
          <article className={`${styles.pedal} ${pedal.color}`} key={pedal.name}>
            <div className={styles["pedal-top"]}>
              {String(index + 1).padStart(2, "0")} / {pedal.name.toUpperCase()}
              <span className={`${styles.led} ${pedal.active ? styles.on : ""}`} role="img" aria-label={`${pedal.name}: ${pedal.active ? "ligado" : "ativação não especificada"}`} />
            </div>
            {index === 0 ? (
              <div className={styles.pedalknobs}>{overdriveControls.map((control) => <Knob key={control.label} {...control} />)}</div>
            ) : <div className={styles.pending} aria-hidden="true"><i /><i /><i /></div>}
            <h4>{pedal.name}</h4>
            <div className={styles.caption}>{pedal.caption}</div>
            {index > 0 && <p className={styles["pending-note"]}>Aguardando suas configurações.</p>}
            <div className={styles.switch} aria-hidden="true" />
          </article>
        ))}
      </div>
      <div className={styles.statusrow}><span aria-live="polite">{status}</span><span>Posições dos botões em horas</span></div>
    </section>
  );
}
