export const repertoireConfig = {
  partSuggestions: ["Intro", "1ª estrofe", "2ª estrofe", "Pré-refrão", "Refrão", "Ponte", "Solo", "Final"],
  effects: [
    { id: "overdrive", label: "Overdrive", model: "Pure Sky" },
    { id: "delay", label: "Delay", model: "Elemental" },
    { id: "reverb", label: "Reverb", model: "Mini Universe" },
  ],
  states: [
    { value: "unspecified", label: "A definir" },
    { value: "on", label: "Ligado" },
    { value: "off", label: "Desligado" },
  ],
} as const;
