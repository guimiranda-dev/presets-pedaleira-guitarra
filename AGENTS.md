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

Antes de alterar músicas, trechos ou persistência do repertório, leia [docs/repertoire.md](docs/repertoire.md). Preserve os dados existentes no Firestore e diferencie efeitos desligados de efeitos ainda não informados.

## GCP, OTP e credenciais

Leia [docs/firestore.md](docs/firestore.md) antes de alterar autenticação ou persistência. Use o cliente Firestore da GCP somente no servidor. O login é por e-mail e código OTP enviado por SMTP, com conta autorizada, limite de envios/tentativas e sessão em cookie HttpOnly. Derive o UID da sessão validada e confira Origin nas escritas. Preserve os hashes, a expiração e as transações para consumo único dos códigos. Não registre códigos, tokens ou credenciais. Não grave presets ou ajustes dos pedais no banco. Não importe dados locais nem crie músicas de exemplo. Preserve a verificação de revisão nas músicas.

Mantenha os SDKs Node do Firestore/autenticação Google em `serverExternalPackages`. Ao alterar esse empacotamento, valide gravação no build de produção: o serializador Protobuf depende do nome da classe `Long`, e testes apenas de leitura não detectam a falha de serialização de inteiros.
