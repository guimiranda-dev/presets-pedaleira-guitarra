import { amplifierConfig } from "@/config/tonebook";
import type { Preset } from "@/types/tonebook";
import { Knob } from "./knob";
import gear from "./gear.module.css";

export function TankG({ preset }: { preset: Preset }) {
  return (
    <div className={gear["tank-section"]}>
      <div className={gear.tank}>
        <div className={gear["tank-top"]}>
          <span>{amplifierConfig.brand}</span>
          <strong>{amplifierConfig.model}</strong>
          <span>AMP / EQ</span>
        </div>
        <div className={gear["tank-controls"]}>
          {amplifierConfig.panelOrder.map((index) => (
            <Knob
              key={amplifierConfig.labels[index]}
              label={amplifierConfig.labels[index]}
              value={preset.values[index]}
              rotation={amplifierConfig.startAngle + ((preset.values[index] - amplifierConfig.min) / (amplifierConfig.max - amplifierConfig.min)) * amplifierConfig.sweepAngle}
              className={gear.control}
            />
          ))}
        </div>
        <div className={gear["tank-bottom"]}>
          <span className={gear["tank-model"]}>{preset.amp}<small>{preset.ir}</small></span>
          <span className={gear.display} aria-label={`Preset ${preset.id}`}>{preset.id}</span>
          <span className={gear["tank-switches"]} aria-hidden="true">
            {["A", "B", "C", "D"].map((letter) => (
              <span key={letter}><span className={gear.footswitch} />{letter}</span>
            ))}
          </span>
        </div>
      </div>
      <p className={gear["tank-note"]}>Seção de amplificador da Tank-G · Valores na escala {amplifierConfig.min}–{amplifierConfig.max}</p>
    </div>
  );
}
