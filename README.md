# Tonebook

Biblioteca pessoal de timbres de guitarra, migrada de `index.html` para Next.js App Router com React e TypeScript.

## Executar

```bash
pnpm install
pnpm dev
```

Acesse http://localhost:3000. Para validar e executar a versão de produção:

```bash
pnpm lint
pnpm build
pnpm start
```

## Configuração

- `config/tonebook.ts`: presets, textos principais da página, escala do amplificador e posições dos controles dos pedais.
- `config/theme.css`: variáveis de cores do tema e dos equipamentos.
- `types/tonebook.ts`: contrato dos presets. `values` segue a ordem Gain, Treble, Middle, Bass e Volume, na escala de 0 a 100.

Os bancos e contadores são derivados dos presets. O identificador usa o número do banco seguido da letra da posição (por exemplo, `1A` ou `2A`). Para cadastrar outro timbre, adicione um objeto ao array `presets`.

`od: true` indica overdrive ligado; `false` mantém a indicação original de ativação não especificada. `ambience: true` indica delay e reverb ligados. Os controles ficam em `overdriveControls`, `delayControls` e `reverbControls`.

O delay M-Vave Elemental está configurado com Time em 11h30, Type em Duck, Feedback em 10h, Mix em 12h, Param em 10h e Mod em 9h. O reverb M-Vave Mini Universe usa Decay em 1h, Type em Blom, Mix em 11h, Param1 em 10h, Param2 em 1h e Param3 em 2h. Em ambos, Type exibe o modo escolhido sem atribuir uma posição em horas.

Delay e reverb têm duas configurações selecionáveis no pedalboard e em cada trecho do repertório. A configuração 1 mantém os ajustes acima; a configuração 2 (B) usa Analog no delay e Hall no reverb, com os valores cadastrados em `delayConfigurations` e `reverbConfigurations`, em `config/tonebook.ts`. As configurações 3 foram removidas.

As regras para configurar controles e adicionar outros modos estão em [docs/pedal-configurations.md](docs/pedal-configurations.md).

O pedalboard representa o Caline Pure Sky, o M-Vave Elemental e o M-Vave Mini Universe com cores, proporções e controles inspirados nos equipamentos físicos. A seção do amplificador representa a M-Vave Tank-G com os cinco ajustes cadastrados. Modelos e marcas ficam em `pedalModels` e `amplifierConfig`.

## Repertório

A seção abaixo do pedalboard permite cadastrar e editar músicas com trechos ordenados, presets da Tank-G, estados de overdrive/delay/reverb e anotações. Use **Nova música**, **Adicionar trecho** e **Salvar música**. A busca consulta música e artista.

As edições são salvas neste navegador, sem sincronização entre dispositivos. As músicas iniciais vêm das referências dos presets; efeitos ainda não informados aparecem como **A definir**. Veja [docs/repertoire.md](docs/repertoire.md) para a estrutura e as regras de manutenção.

## Estrutura

A rota e os metadados usam Server Components. A biblioteca interativa fica em `components/tonebook`, com componentes para detalhes, pedalboard e controles visuais, e estilos isolados por CSS Modules.

A busca consulta nome, código, música e artista, ignorando maiúsculas e acentos. Filtros e busca mantêm o detalhe sincronizado com os resultados; uma busca sem resultados exibe um estado vazio. Os controles rotativos e os interruptores são representações visuais para consulta.

Os presets e ajustes dos pedais são estáticos. O repertório tem persistência local no navegador, sem serviços externos. Não são necessárias variáveis de ambiente. O arquivo `index.html` foi preservado como referência.
