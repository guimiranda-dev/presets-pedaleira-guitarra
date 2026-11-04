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

- `config/tonebook.ts`: presets, textos principais da página, escala do amplificador e posições dos controles do overdrive.
- `config/theme.css`: variáveis de cores do tema.
- `types/tonebook.ts`: contrato dos presets. `values` segue a ordem Gain, Treble, Middle, Bass e Volume, na escala de 0 a 100.

Os bancos e contadores são derivados dos presets. O identificador usa o número do banco seguido da letra da posição (por exemplo, `1A` ou `2A`). Para cadastrar outro timbre, adicione um objeto ao array `presets`.

`od: true` indica overdrive ligado; `false` mantém a indicação original de ativação não especificada. `ambience: true` indica delay e reverb ligados. As posições desses dois pedais ainda estão pendentes, conforme o HTML de referência.

## Estrutura

A rota e os metadados usam Server Components. A biblioteca interativa fica em `components/tonebook`, com componentes para detalhes, pedalboard e controles visuais, e estilos isolados por CSS Modules.

A busca consulta nome, código, música e artista, ignorando maiúsculas e acentos. Filtros e busca mantêm o detalhe sincronizado com os resultados; uma busca sem resultados exibe um estado vazio. Os controles rotativos e os interruptores são representações visuais para consulta.

Os dados são estáticos, sem persistência ou serviços externos. Não são necessárias variáveis de ambiente. O arquivo `index.html` foi preservado como referência.
