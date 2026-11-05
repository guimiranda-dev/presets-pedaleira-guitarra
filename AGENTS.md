<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Configurações e modos dos pedais

Antes de alterar controles, ajustes ou adicionar modos ao pedalboard, leia [docs/pedal-configurations.md](docs/pedal-configurations.md) e siga suas regras.

- Mantenha os valores em `config/tonebook.ts`, separados da apresentação.
- Preserve configurações existentes quando o pedido for adicionar outro modo.
- Use os controles e valores fornecidos pelo usuário; não invente posições físicas para seletores como `Type`.

## Repertório de músicas

Antes de alterar músicas, trechos ou persistência do repertório, leia [docs/repertoire.md](docs/repertoire.md). Preserve os dados locais existentes e diferencie efeitos desligados de efeitos ainda não informados.
