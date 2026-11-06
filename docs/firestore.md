# Firestore da GCP e login por e-mail

O repertório usa diretamente o SDK oficial `@google-cloud/firestore`, no projeto **vernal-citadel-309420**, banco nomeado **preset-pedals-guitar**, região **us-central1**. Não é necessário cadastrar uma aplicação Firebase nem configurar OAuth Google.

## Ambiente

Copie `.env.example` para `.env.local` e preencha as variáveis. Nenhuma delas precisa do prefixo `NEXT_PUBLIC_`.

- `GOOGLE_CLOUD_PROJECT` e `FIRESTORE_DATABASE_ID`: identificam o banco existente.
- `APP_ORIGIN`: origem exata da aplicação, como `http://localhost:3000` em desenvolvimento e `https://seu-dominio.com` em produção. É validada nas requisições que alteram dados.
- `AUTH_ALLOWED_EMAILS`: e-mails autorizados, separados por vírgula. Para este projeto, a conta é `guilhermemiranda.ti@gmail.com`. Vazio bloqueia o login.
- `AUTH_SECRET`: segredo aleatório de pelo menos 32 caracteres, usado para proteger os hashes dos códigos. Gere um valor com o comando indicado no `.env.example`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `OTP_FROM_EMAIL`: configuração do serviço que enviará os códigos.

O serviço de e-mail ainda precisa ser contratado ou configurado pelo usuário. A aplicação não cria conta em provedor nem envia por um SMTP público de teste. `OTP_FROM_EMAIL` deve ser um endereço remetente autorizado pelo serviço. A porta 587 usa STARTTLS obrigatório (`SMTP_SECURE=false`); a porta 465 usa TLS desde a conexão (`SMTP_SECURE=true`). Credenciais e códigos não são registrados em logs.

## Credenciais GCP

Use uma das opções:

- **Desenvolvimento com ADC:** `gcloud auth application-default login`. Se necessário, configure o projeto de quota com `gcloud auth application-default set-quota-project vernal-citadel-309420`. O login da CLI gcloud é separado das credenciais usadas pelo SDK.
- **Cloud Run/GCP:** atribua uma service account ao serviço e use a identidade automática, sem arquivos de chave.
- **Arquivo local:** defina `GOOGLE_APPLICATION_CREDENTIALS` com o caminho absoluto de uma chave de service account fora do repositório.
- **Hospedagem fora da GCP:** configure `GOOGLE_CLOUD_CLIENT_EMAIL` e `GOOGLE_CLOUD_PRIVATE_KEY` nos secrets da hospedagem. A chave aceita quebras de linha ou `\n` literais.

A identidade do servidor precisa de acesso a documentos do Firestore, por exemplo `roles/datastore.user`. Não são necessários papéis do Firebase Authentication. O navegador não acessa o banco diretamente; toda leitura e gravação passa pela API Next.js e pelo IAM da identidade do servidor.

## Login OTP

1. O usuário informa seu e-mail.
2. Para um e-mail autorizado, o servidor gera seis dígitos usando aleatoriedade criptográfica e envia por SMTP.
3. O código vale por 10 minutos e uma única verificação bem-sucedida. Um reenvio substitui o desafio anterior.
4. Há no máximo cinco tentativas por código, intervalo de um minuto entre envios e cinco envios por hora por e-mail. Os limites são persistidos em transações, funcionando entre instâncias da aplicação.
5. O código correto cria uma sessão de sete dias. O navegador recebe um cookie `HttpOnly`, `SameSite=Lax`, com `Secure` e prefixo `__Host-` em produção.
6. Logout revoga a sessão no banco e limpa o cookie. Remover um e-mail da lista também bloqueia suas sessões existentes.

Pedidos de envio têm resposta genérica para não confirmar se uma conta está autorizada. Pedidos acima do limite não enviam novos e-mails, mantendo a resposta genérica. Após cinco tentativas erradas, é preciso pedir outro código respeitando os limites de envio.

O cookie contém um token aleatório de 256 bits; o banco contém somente seu hash. O código OTP também é armazenado somente como HMAC com segredo do servidor e identificador de desafio. As verificações usam comparação de tempo constante. A sessão usa um identificador de usuário estável derivado do e-mail normalizado, sem dependência de UID do Firebase.

Alterar `AUTH_SECRET` invalida códigos pendentes. Sessões já existentes continuam até expirar, sair ou serem removidas; para revogação global, remova os documentos de `authSessions` administrativamente. Em produção, use HTTPS. Para desenvolvimento local em HTTP, use `pnpm dev`.

## Dados e coleções

```text
users/{sha256DoEmailNormalizado}/songs/{songId}
  id, title, artist, parts
  schemaVersion: 1
  createdAt, updatedAt

authChallenges/{sha256DoEmailNormalizado}
  challengeId, codeHash, attempts, consumed, sentAt
  expiresAt, deleteAt

authSessions/{sha256DoTokenDeSessao}
  uid, email, createdAt, expiresAt
```

O repertório começa vazio. Não há importação de dados locais nem músicas de exemplo. Modelos de pedais, knobs e presets continuam em `config/tonebook.ts`; no repertório são salvas apenas as referências escolhidas por trecho. As outras duas coleções contêm metadados temporários necessários ao login.

Opcionalmente, configure políticas TTL na GCP para `authChallenges.deleteAt` e `authSessions.expiresAt`. A autorização sempre confere a expiração por conta própria, sem depender da remoção assíncrona pelo TTL. Mesmo quando consumido, um desafio permanece até sua limpeza para preservar os limites de envio da última hora.

## API

- `POST /api/auth/otp/request`: `{ email }`.
- `POST /api/auth/otp/verify`: `{ email, code }`; define o cookie de sessão sem retornar o token no JSON.
- `GET /api/auth/session`: usuário da sessão atual.
- `POST /api/auth/logout`: revoga e remove a sessão.
- `GET /api/repertoire`: músicas do usuário autenticado.
- `PUT /api/repertoire/songs/{songId}`: `{ song, revision }`.

Todas as operações de escrita exigem `Origin` igual a `APP_ORIGIN`. O UID vem exclusivamente da sessão validada, nunca do corpo enviado pelo navegador. Respostas usam `Cache-Control: private, no-store`.

Uma música tem até 100 trechos e a requisição de gravação tem limite de 512 KB. IDs, textos, presets, configurações e trechos únicos são validados. A revisão do documento é exigida para editar e validada em transação; uma edição concorrente retorna 409, preservando o formulário para o usuário copiar suas alterações antes de cancelar e reabrir a versão atual.

A lista carrega após login e pode ser recarregada pelo botão **Atualizar**. Não há listener contínuo nem fallback para salvar músicas no navegador. A consulta usa um índice simples de `createdAt`, disponível por padrão. Esta implementação não altera permissões, políticas TTL ou recursos da GCP automaticamente.

## Verificação

```bash
pnpm test
pnpm lint
pnpm build
```

Os testes usam doubles de Firestore e envio de e-mail, sem disparar mensagens reais. Cobrem expiração, código consumido, limite de tentativas e envios, verificação simultânea, cookies, origem, sessões revogadas, autorização e concorrência nas músicas. Build funciona sem SMTP ou credenciais GCP; o login real depende desses serviços configurados.

Depois de preencher o ambiente, solicite um código com seu e-mail autorizado, verifique-o e crie uma música. Recarregue para confirmar a leitura do banco. Nenhum envio real foi realizado durante a implementação, pois não há provedor SMTP configurado.

## Referências oficiais

- [Cliente Firestore da GCP](https://docs.cloud.google.com/firestore/docs/samples/firestore-setup-client-create).
- [Application Default Credentials](https://docs.cloud.google.com/docs/authentication/provide-credentials-adc).
- [Configuração SMTP do Nodemailer](https://nodemailer.com/smtp).

## Diagnóstico de conexão e envio

`GET /api/auth/session` com status 401 é esperado antes de entrar. O código OTP só pode ser enviado depois de registrar o desafio no Firestore.

- **Firestore PERMISSION_DENIED (código 7):** confira se a service account em `GOOGLE_CLOUD_CLIENT_EMAIL` tem acesso aos documentos no projeto `vernal-citadel-309420`, incluindo `authChallenges`, `authSessions` e o repertório. O papel padrão é `roles/datastore.user` (Cloud Datastore User); a configuração de acesso pode restringi-lo ao banco conforme a política IAM do projeto. Uma chave privada válida identifica a conta, mas não concede essa permissão.
- **Gmail EAUTH / SMTP 535:** use uma senha de app gerada na conta indicada por `SMTP_USER`, com verificação em duas etapas ativada. Use `SMTP_HOST=smtp.gmail.com`, porta 587 com `SMTP_SECURE=false`, ou 465 com `SMTP_SECURE=true`. A senha de app é diferente da senha de login da conta. Reinicie o servidor depois de alterar `.env.local`.

O cliente Firestore usa `auth: new GoogleAuth(...)`; credenciais explícitas são passadas a um cliente JWT, em vez da opção depreciada `credentials`. Os logs de falhas registram serviço, códigos e uma mensagem sanitizada. Mensagens que mencionam dados de autenticação são omitidas; segredos configurados e e-mails são removidos antes do registro. Nenhuma alteração de IAM ou senha é feita automaticamente pelo aplicativo.
