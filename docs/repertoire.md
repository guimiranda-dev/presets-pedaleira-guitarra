# Repertório e roteiros de timbres

A área de repertório fica abaixo do pedalboard. Ela permite cadastrar e editar músicas, criar trechos com nomes livres (Intro, 1ª estrofe, Refrão, Ponte etc.), reordená-los e anotar os efeitos de cada entrada.

## Onde ficam os dados

- `types/repertoire.ts`: contratos `Song`, `SongPart`, `EffectId` e `EffectState`.
- `config/repertoire.ts`: músicas iniciais, sugestões de nomes dos trechos, opções dos efeitos e chave do armazenamento.
- `lib/repertoire-storage.ts`: leitura, validação e salvamento no navegador.
- `components/tonebook/repertoire.tsx`: busca e consulta dos roteiros.
- `components/tonebook/song-editor.tsx`: formulário de cadastro e edição.

As músicas iniciais reaproveitam apenas as associações já cadastradas nos presets. O trecho genérico `Referência` indica que o arranjo por partes ainda precisa ser preenchido. Não invente efeitos ou estruturas de músicas como se tivessem sido fornecidos pelo usuário.

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

As edições são salvas em `localStorage`, sob a chave versionada de `repertoireConfig.storageKey`, e sobrevivem à recarga. Abas do mesmo navegador são notificadas das alterações. Não há conta, backend ou sincronização entre dispositivos. Limpar os dados do navegador remove as edições.

Depois do primeiro salvamento, a lista local substitui as referências iniciais naquele navegador. Alterar `initialSongs` no código não mescla automaticamente novas músicas com a lista local. A leitura aceita músicas antigas sem o campo `configurations` e as adapta em memória: delay/reverb previamente ligados recebem a configuração 1; os demais estados ficam sem configuração. IDs, músicas, trechos, estados e anotações são preservados. A chave de armazenamento v1 foi mantida e a migração só é gravada no próximo salvamento explícito. Se o contrato mudar novamente, preserve essa compatibilidade ou implemente uma migração adicional.

Se a gravação falhar, o formulário permanece aberto com os dados digitados. Se o conteúdo salvo estiver inválido, a página avisa e mostra as referências iniciais sem gravar por conta própria.

Referências antigas a Delay 3 e Reverb 3 são reconhecidas apenas para migração: a configuração é limpa e, se estava ligada, o efeito volta a **A definir**, sem substituir por outro timbre. Os demais dados da música são preservados.
