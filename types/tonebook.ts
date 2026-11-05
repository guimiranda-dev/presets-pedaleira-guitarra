export interface PedalControl {
  readonly label: string;
  readonly value: string | number;
  readonly rotation?: number;
}

export type DelayConfigurationId = "delay-1" | "delay-2";
export type ReverbConfigurationId = "reverb-1" | "reverb-2";

export interface PedalConfiguration<Id extends string = string> {
  readonly id: Id;
  readonly label: string;
  /** null indica que os valores ainda serão fornecidos pelo usuário. */
  readonly controls: readonly PedalControl[] | null;
}

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
  readonly delayConfigurationId?: DelayConfigurationId;
  readonly reverbConfigurationId?: ReverbConfigurationId;
}
