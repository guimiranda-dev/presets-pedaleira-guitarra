import type { CSSProperties } from "react";
import styles from "./tonebook.module.css";

interface KnobProps {
  label: string;
  value: string | number;
  rotation: number;
}

export function Knob({ label, value, rotation }: KnobProps) {
  const style = { "--rot": `${rotation}deg` } as CSSProperties;

  return (
    <div className={styles.knobwrap}>
      <div className={styles.knob} style={style} aria-hidden="true" />
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
