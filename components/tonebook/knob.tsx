import type { CSSProperties } from "react";
import styles from "./tonebook.module.css";

interface KnobProps {
  label: string;
  value: string | number;
  rotation?: number;
  className?: string;
}

export function Knob({ label, value, rotation, className = "" }: KnobProps) {
  const style = rotation === undefined
    ? undefined
    : { "--rot": `${rotation}deg` } as CSSProperties;

  return (
    <div className={`${styles.knobwrap} ${className}`}>
      <div
        className={`${styles.knob} ${rotation === undefined ? styles["knob-selector"] : ""}`}
        style={style}
        aria-hidden="true"
      />
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
