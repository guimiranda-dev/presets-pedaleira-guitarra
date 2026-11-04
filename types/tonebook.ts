export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly pickup: string;
  readonly amp: string;
  readonly ir: string;
  /** Gain, treble, middle, bass e volume, nesta ordem. */
  readonly values: readonly [number, number, number, number, number];
  readonly desc: string;
  readonly song?: string;
  readonly artist?: string;
  readonly type: string;
  readonly od: boolean;
  readonly ambience?: boolean;
}
