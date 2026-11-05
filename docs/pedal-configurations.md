# Regras para configurações de pedais

Este guia orienta alterações e novos modos do pedalboard. Os valores fornecidos pelo usuário são a referência para os ajustes.

## Arquivos e responsabilidades

- `config/tonebook.ts`: fonte dos controles (`overdriveControls`, `delayControls`, `reverbControls`) e das configurações nomeadas (`delayConfigurations`, `reverbConfigurations`).
- `components/tonebook/pedalboard.tsx`: apresenta os controles configurados e o estado dos pedais.
- `components/tonebook/gear.module.css`: aparência e proporções dos equipamentos.
- `components/tonebook/tank-g.tsx`: representação da seção AMP / EQ da Tank-G.
- `components/tonebook/knob.tsx`: apresenta o nome, valor e indicador de posição de um controle.
- `types/tonebook.ts`: contrato dos presets de amplificador.

Mantenha ajustes na configuração, sem duplicar valores nos componentes. Preserve a ordem e os nomes dos controles informados para cada modelo físico. Cada `label` deve ser único dentro da configuração do pedal.

## Formato de um controle

```ts
{ label: "Time", value: "11h30", rotation: -15 }
{ label: "Type", value: "Duck" }
```

`label` é o nome exibido no pedal. `value` é o ajuste exibido, preservando a unidade: por exemplo, `12h`, `11h30` ou `Duck`. `rotation` é o ângulo visual em graus, com 12h apontando para cima.

Para posições em horas, cada hora equivale a 30° e cada minuto equivale a 0,5°. Escolha a representação do horário mais próxima de 12h: posições antes de 12h têm ângulo negativo; posições depois de 12h têm ângulo positivo.

| Posição | Rotação |
| --- | --- |
| 9h | -90° |
| 10h | -60° |
| 11h30 | -15° |
| 12h | 0° |
| 13h (1h) | 30° |
| 15h (3h) | 90° |

Essa conversão determina apenas a posição visual. Não converta horas em milissegundos, porcentagens, intensidade ou outros parâmetros de áudio sem uma correspondência fornecida pelo usuário ou documentada para o modelo.

Para seletores de modo, como `Type: Duck`, omita `rotation` quando a posição física não for conhecida. O componente exibe o valor sem ponteiro; não use `0` como posição desconhecida, pois isso significa 12h.

## Configuração de referência: Caline Pure Sky

O overdrive é o Caline Pure Sky (CP-12). A disposição física é `Volume`, `Gain` na primeira linha e `Treble`, `Bass` na segunda. Preserve os ajustes existentes: Volume 12h, Gain 9h, Treble 12h e Bass 12h. O gabinete é azul-turquesa e os quatro knobs são brancos.

## Configuração de referência: M-Vave Elemental

O delay tem seis controles, nesta ordem:

| Controle | Valor | Rotação |
| --- | --- | --- |
| Time | 11h30 | -15° |
| Type | Duck | Sem posição informada |
| Feedback | 10h | -60° |
| Mix | 12h | 0° |
| Param | 10h | -60° |
| Mod | 9h | -90° |

Mantenha `Param` com esse nome. Seu significado em outros modos deve ser informado ou confirmado antes de adicionar descrições específicas.

## Configuração de referência: M-Vave Mini Universe

O reverb tem seis controles, nesta ordem:

| Controle | Valor | Rotação |
| --- | --- | --- |
| Decay | 1h | 30° |
| Type | Blom | Sem posição informada |
| Mix | 11h | -30° |
| Param1 | 10h | -60° |
| Param2 | 1h | 30° |
| Param3 | 2h | 60° |

Preserve a grafia `Blom` fornecida pelo usuário e os nomes `Param1`, `Param2` e `Param3`. Não atribua significados específicos a esses parâmetros sem informação confirmada para o modo.

## Configuração B / 2

| Controle do delay | Valor | Rotação |
| --- | --- | --- |
| Time | 11h30 | -15° |
| Type | Analog | Sem posição informada |
| Feedback | 10h | -60° |
| Mix | 9h | -90° |
| Param | 12h | 0° |
| Mod | 9h | -90° |

| Controle do reverb | Valor | Rotação |
| --- | --- | --- |
| Decay | 11h | -30° |
| Type | Hall | Sem posição informada |
| Mix | 10h | -60° |
| Param1 | 10h | -60° |
| Param2 | 1h | 30° |
| Param3 | 12h | 0° |

## Como atender pedidos de outros modos

1. Identifique se o pedido é para substituir o ajuste atual, adicionar uma configuração alternativa do mesmo pedal ou cadastrar outro preset de amplificador.
2. Para substituir o ajuste atual, altere o array de controles correspondente em `config/tonebook.ts`, mantendo os demais pedais.
3. Existem três configurações por pedal em `delayConfigurations` e `reverbConfigurations`, com IDs estáveis (`delay-1` a `delay-3` e `reverb-1` a `reverb-3`). Preserve as configurações existentes, inclusive Duck em Delay 1 e Blom em Reverb 1.
4. A configuração 1 usa os ajustes originais de `delayControls` e `reverbControls`. A configuração 2 (B) está preenchida: Analog no delay e Hall no reverb. Somente a configuração 3 tem `controls: null` e aparece como pendente no pedalboard e no repertório. No pedalboard os knobs pendentes exibem `—`, sem posição física. Para preencher uma configuração, substitua apenas seu `controls: null` pelo array completo de controles fornecidos; preserve seu ID para manter as escolhas das músicas. Nunca copie a configuração 1 como se fossem os valores reais de outra configuração.
5. Registre os valores informados para o novo modo. Não herde silenciosamente ajustes de outro modo nem invente controles ou posições ausentes; se faltarem dados necessários, peça os valores ao usuário.
6. Mantenha o estado de ativação separado dos ajustes. Hoje `od` controla a indicação de overdrive e `ambience` indica delay e reverb ligados; cadastrar um modo não muda esses estados automaticamente.
7. Atualize a documentação afetada e execute `pnpm lint` e `pnpm build` após alterações de código.

## Configurações de pedais por preset

Um preset pode informar `delayConfigurationId` e `reverbConfigurationId`. Referências por letras usam A = configuração 1, B = configuração 2 e C = configuração 3. O preset `2B — Clean lead` usa `delay-2` e `reverb-2`, com ambos ligados via `ambience: true`. Os valores da configuração B estão cadastrados nas tabelas deste guia. Não confunda a letra da posição do preset na Tank-G com a configuração dos pedais; registre as referências explicitamente.

Ao trocar o preset selecionado, o pedalboard reinicia nos ajustes associados a ele. Seletores manuais permitem consultar outras configurações sem editar o preset. No repertório, escolher um preset com configurações explícitas preenche essas referências; o usuário pode alterá-las depois.

O campo `type` de um preset de amplificador representa sua categoria musical (por exemplo, `Limpo` ou `Solo`). Ele não é o seletor `Type` do Elemental ou do Mini Universe. Os valores do amplificador seguem a escala 0–100 e não usam a conversão dos pedais em horas.

## Apresentação

Os modelos e marcas ficam em `pedalModels` e `amplifierConfig`, em `config/tonebook.ts`. As cores principais ficam em `config/theme.css`. A aparência é implementada com CSS, sem fotos externas em tempo de execução.

Preserve as disposições físicas: Pure Sky em 2×2; Elemental e Mini Universe em 3×2. O Elemental tem gabinete roxo e knobs pretos. O Mini Universe tem gabinete azul e knobs pretos. Por preferência do usuário, os três pedais devem ter a mesma largura e altura em cada tamanho de tela; não reduza o Pure Sky para aproximar a escala física. Use as dimensões compartilhadas de `.unit` e `.stomp`. Mantenha proporções verticais, footswitches metálicos, LEDs e valores legíveis. O pedalboard permite quebra de linha em telas menores, preservando o formato dos pedais.

A pedaleira é a M-Vave Tank-G. Sua seção AMP / EQ usa acabamento verde metálico e controles vermelhos. A ordem visual é Volume, Bass, Middle, Treble, Gain, definida em `amplifierConfig.panelOrder`. O armazenamento em `Preset.values` continua Gain, Treble, Middle, Bass, Volume; use os índices para manter cada valor associado ao controle correto.

A representação da Tank-G é parcial: mostra somente os cinco ajustes cadastrados do amplificador, o modelo de amp, o IR e o código do preset. Não preencha os demais controles do equipamento com valores inventados. Os knobs e interruptores de todos os equipamentos são referências visuais de consulta, sem controle do equipamento físico. A aparência é aproximada, sem compromisso de escala física exata.

### Referências visuais

- [Caline Pure Sky — foto frontal](https://img.audiofanzine.com/images/u/product/normal/caline-cp-12-pure-sky-182804.jpg).
- [M-Vave Elemental — foto frontal](https://www.guitarshopce.com.br/pedal-m-vave-elemental-delay).
- [M-Vave Mini Universe — fotos do produto](https://tankpedal.com/products/guitar-pedal-reverb-innovation-unique-sound-9-reverb-effects-universe-pedals-pure-digital).
- [M-Vave Tank-G — fotos do produto](https://www.rckaudio.com.br/guitarra/pedais-e-efeitos/pedaleira-m-vave-tank-g-multiefeito-para-guitarra).

As fotos orientam cores, ordem e aparência dos controles; os valores dos ajustes continuam sendo os fornecidos pelo usuário.
