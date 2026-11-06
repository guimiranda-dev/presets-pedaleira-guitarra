# Repertório e roteiros de timbres

A área de repertório fica abaixo do pedalboard. Ela permite cadastrar e editar músicas, criar trechos com nomes livres (Intro, 1ª estrofe, Refrão, Ponte etc.), reordená-los e anotar os efeitos de cada entrada.

A lista de músicas é exibida em ordem alfabética pelo título (pt-BR, sem distinção de maiúsculas ou acentos), inclusive após cadastro e edição. Títulos iguais são ordenados por artista e ID. A ordem dos trechos de cada música continua sendo a definida pelo usuário.

## Onde ficam os dados

- `types/repertoire.ts`: contratos `Song`, `SongPart`, `EffectId` e `EffectState`.
- `config/repertoire.ts`: músicas iniciais, sugestões de nomes dos trechos, opções dos efeitos e chave do armazenamento.
- `hooks/use-cloud-repertoire.ts`: leitura e salvamento pela API autenticada.
- `lib/repertoire-schema.ts`: validação de documentos.
- `lib/server/repertoire.ts`: persistência e transações no Firestore.
- `components/tonebook/repertoire.tsx`: busca e consulta dos roteiros.
- `components/tonebook/song-editor.tsx`: formulário de cadastro e edição.

O repertório começa vazio e é cadastrado pelo usuário após login por código enviado ao e-mail. Não adicione exemplos automaticamente nem importe localStorage. Os presets continuam no código; não invente efeitos ou estruturas de músicas como se tivessem sido fornecidos pelo usuário.

## Estrutura de um trecho

```ts
{
  id: "minha-musica-intro",
  name: "Intro",
  presetId: "1A",
  effects: {
    overdrive: "unspecified",
    delay: "unspecified",
    reverb: "unspecified",
  },
  configurations: { delay: "", reverb: "" },
  notes: "Descreva aqui a entrada e a dinâmica da sua versão.",
}
```

Cada música contém `id`, `title`, `artist` e um array ordenado `parts`. IDs devem ser únicos, e cada música cadastrada pelo formulário tem pelo menos um trecho. Nomes de trechos podem se repetir, pois uma música pode ter vários refrões e pontes. `presetId` vazio significa que o preset ainda está a definir.

Efeitos usam três estados explícitos: `on` (ligado), `off` (desligado) e `unspecified` (a definir). Ausência de informação não significa desligado. Ao selecionar um preset no formulário, são preenchidas as indicações já conhecidas de `od` e `ambience`; o usuário pode ajustar cada efeito independentemente para aquele trecho.

Para delay e reverb, o formulário oferece `A definir`, `Desligado` e as configurações numeradas 1 e 2. Escolher uma configuração liga aquele efeito no trecho e salva seu ID em `configurations.delay` ou `configurations.reverb`. As escolhas são independentes: por exemplo, Delay 2 e Reverb 1. Configurações sem valores continuam selecionáveis e aparecem como **Valores pendentes** no roteiro. Desligar o efeito preserva a referência escolhida, mas o roteiro exibe o estado desligado.

Ao mudar o preset do amplificador, as referências explícitas `delayConfigurationId` e `reverbConfigurationId` têm prioridade. Assim, escolher 2B preenche Delay 2 e Reverb 2. Quando o preset não tem referências explícitas, preserva-se a configuração já escolhida; se ele indicar ambiência e ainda não houver configuração, usa-se Delay 1 e Reverb 1. O usuário pode ajustar as escolhas depois.

Os estados por trecho não mudam os presets globais nem as posições dos knobs dos pedais. O botão de consulta do preset abre sua referência na biblioteca, limpando os filtros; ele não aplica automaticamente os estados específicos do trecho ao pedalboard. Consulte o roteiro para saber quais pedais ligar. Para novas configurações de knobs, siga também `docs/pedal-configurations.md`.

## Salvamento

O repertório é salvo no Firestore pela API Next.js, com login por OTP de e-mail e acesso restrito aos e-mails autorizados no servidor. Cada música tem seu documento em `users/{uid}/songs/{songId}`, no banco nomeado `preset-pedals-guitar` do projeto `vernal-citadel-309420`. Não há importação, seed ou persistência local das músicas.

A API verifica identidade e permissões antes de acessar o banco. Use `revision` para editar documentos existentes; um conflito retorna 409 e preserva o formulário. Não remova essa proteção nem aceite um UID informado pelo cliente para escolher o caminho do documento.

O cadastro e edição confirmam sucesso somente depois da gravação no Firestore. Os valores dos knobs, modelos de pedais e presets da Tank-G continuam em `config/tonebook.ts`; o banco armazena apenas as referências escolhidas no roteiro.

Consulte [firestore.md](firestore.md) para variáveis de ambiente, credenciais, regras e instruções de configuração do login OTP e do serviço SMTP.
