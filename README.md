# Synapse

Plano de saúde mental para empresas:

- a **empresa** paga R$ 200 por funcionário ao mês;
- o **funcionário** tem 1 sessão por semana com um psicólogo fixo;
- o **psicólogo** não paga para estar na plataforma e recebe R$ 50 por sessão realizada.

Esses valores ficam em `src/config/pricing.ts` (front) e `server/src/config.js` (API).

Front end em React 19 + Vite + Tailwind CSS v4 + React Router, ligado à API de `server/`.

## Áreas

| Rota | O que é |
| --- | --- |
| `/` | Página pública com preços e chamadas para empresas e psicólogos |
| `/entrar` | Login e cadastro (funcionário ou psicólogo) |
| `/app/*` | Funcionário: início, bem-estar, terapeutas (cada psicólogo tem a sua página em `/app/terapeutas/:id`), Synapse AI e check-in |
| `/psi/*` | Psicólogo: início, agenda, pacientes (com a nota de cada sessão e o gráfico de evolução), financeiro e perfil |

A área da empresa (RH) ainda não existe. `ManagementScreen.tsx` e `ExecutiveReportModal.tsx` estão no repositório, sem rota, para servir de base a ela.

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # checagem de tipos
npm run build
```

## Back end (`server/`)

API em JavaScript com Express e Postgres.

```bash
cd server
npm install
cp .env.example .env   # porta e senha das contas de demonstração
npm run dev            # http://localhost:4000/api
npm test               # 35 testes
```

**Banco em desenvolvimento:** sem `DATABASE_URL`, a API roda um Postgres embutido (PGlite) com os arquivos em `server/data/pg`. Não é preciso instalar banco, e os dados de demonstração são criados na primeira vez que a API sobe. O banco embutido aceita um processo por vez: não rode `npm run seed` com a API ligada.

**Banco em produção:** defina `DATABASE_URL` com a URL de um Postgres (por exemplo, o Neon). As tabelas são criadas sozinhas na primeira conexão. Para criar os dados de demonstração nesse banco, uma vez:

```bash
cd server
DATABASE_URL="postgres://..." npm run seed
```

As contas de demonstração são listadas pelo `npm run seed`; a senha é a `SEED_PASSWORD` do `.env`.

**Acesso de teste sem senha:** a tela de login tem três botões (funcionária, primeiro acesso e psicóloga) que entram direto nas contas de demonstração. Na primeira vez, a API cria esses dados sozinha, inclusive em produção, então não é obrigatório rodar o seed. Para remover esse acesso, defina `DEMO_LOGIN=off`.

Os testes usam um Postgres embutido em memória. Para rodá-los contra um servidor de verdade, defina `TEST_DATABASE_URL` (as tabelas desse banco são esvaziadas).

**Fuso horário:** as sessões são horários de parede em `America/Sao_Paulo` (variável `APP_TIME_ZONE`), mesmo que o servidor rode em UTC.

| Rota | Quem | O que faz |
| --- | --- | --- |
| `POST /api/auth/register` | público | Cadastro. Funcionário informa `companyCode`; psicólogo informa `reg` (CRP) e `title` |
| `POST /api/auth/login` | público | Devolve `token` e `user` |
| `POST /api/auth/demo` | público | Entra em uma conta de demonstração, sem senha |
| `POST /api/auth/terms` | logado | Registra o aceite do termo para a conta |
| `PUT /api/auth/avatar` | funcionário | Salva a foto de perfil (imagem pequena em data URL) ou remove com `null` |
| `PUT /api/psi/avatar` | psicólogo | Salva ou remove a foto do perfil público |
| `POST /api/auth/logout`, `GET /api/auth/me` | logado | Encerra a sessão / dados do usuário |
| `GET /api/psychologists`, `GET /api/psychologists/:id` | logado | Psicólogos ativos com os horários semanais livres (`?search=` procura em nome, título, especialidades e abordagens) |
| `GET /api/psychologists/:id/reviews` | logado | Avaliações do psicólogo (sem o nome do autor), média e distribuição; diz se quem consulta pode avaliar |
| `PUT /api/psychologists/:id/review`, `DELETE ...` | funcionário | Publica, altera ou exclui a própria avaliação (1 a 5 estrelas e comentário), só do psicólogo que o atende e depois da primeira sessão |
| `GET /api/psi/reviews` | psicólogo | Avaliações recebidas, sem o nome de quem escreveu |
| `GET /api/checkin`, `PUT /api/checkin` | funcionário | Check-in do dia: guarda só o índice (0 a 100), um por dia; refazer substitui. Índice muito baixo avisa o psicólogo |
| `GET /api/psi/alerts`, `POST /api/psi/alerts/:id/seen` | psicólogo | Pacientes com check-in muito baixo nos últimos 7 dias / marca como visto |
| `GET /api/plan` | funcionário | Psicólogo e horário fixos, próxima sessão |
| `PUT /api/plan` | funcionário | Escolhe ou troca psicólogo e horário fixo |
| `POST /api/plan/reschedule` | funcionário | Remarca só a sessão desta semana |
| `GET /api/psi/availability`, `PUT /api/psi/availability` | psicólogo | Horários semanais oferecidos |
| `GET /api/psi/patients` | psicólogo | Pacientes com horário fixo |
| `GET /api/psi/evaluations` | psicólogo | Notas que o psicólogo deu às sessões dos seus pacientes |
| `PUT /api/psi/patients/:id/evaluations/:data`, `DELETE ...` | psicólogo | Dá, altera ou exclui a nota (1 a 10) e o comentário de uma sessão (`AAAA-MM-DD`) |
| `GET /api/psi/profile`, `PUT /api/psi/profile` | psicólogo | Perfil público: apresentação, especialidades, abordagens e idiomas (só opções do catálogo) |
| `GET /api/catalog` | público | Especialidades (por grupo), abordagens, idiomas e os limites do perfil |
| `GET /api/pricing`, `GET /api/health` | público | Preços do plano / verificação |

As requisições autenticadas levam o cabeçalho `Authorization: Bearer <token>`. Erros voltam como `{ "error": { "code", "message" } }`.

Regras que a API garante: um horário fixo pertence a um funcionário só; a remarcação vale apenas dentro da semana atual e antes de a sessão acontecer; o psicólogo não consegue fechar um horário que tem paciente; psicólogo recém-cadastrado fica oculto até ser aprovado (`npm run approve -- email`).

Em desenvolvimento, o Vite encaminha `/api` para a porta 4000, então rode a API e o front ao mesmo tempo (`npm run dev:api` e `npm run dev`). Para apontar o front para outra API, use a variável `API_TARGET`.

### O que o front já busca na API e o que ainda é simulado

| Vem da API | Ainda simulado no front |
| --- | --- |
| Login, cadastro e sessão | Perguntas do check-in (só o índice do dia vai para a API) |
| Psicólogos e horários livres | Evolução semanal e "dias ativos" |
| Sessão semanal (escolher, trocar, remarcar) | Sugestões da Synapse AI |
| Perfil, agenda e pacientes do psicólogo | Anotações de pacientes (ficam no navegador) |
| Avaliações dos psicólogos (estrelas e comentários) | Financeiro do psicólogo (estimativa pela agenda) |
| Notas das sessões e gráfico de evolução do paciente | Chat com o psicólogo (demonstração: respostas automáticas, conversa só no navegador) |

## Deploy na Vercel

O repositório já tem o necessário: `vercel.json` (build do front, rotas do React e encaminhamento de `/api`) e `api/index.js` (a API como função serverless).

1. Crie um banco Postgres (Neon) e copie a URL de conexão **com pooling** (`-pooler` no host).
2. Importe o repositório na Vercel. Não é preciso mudar as configurações de build.
3. Em *Settings → Environment Variables*, adicione `DATABASE_URL` com a URL do passo 1.
4. Faça o deploy. As contas de teste da tela de login funcionam sem nenhum passo extra.

## Estrutura

- `src/App.tsx`: rotas e proteção por perfil (`src/auth/session.tsx`).
- `src/api/client.ts`: chamadas à API, token e tratamento de erros.
- `src/pages/`: página pública e login.
- `src/areas/employee/`: container da área do funcionário e o plano semanal (`plan.tsx`).
- `src/areas/psychologist/`: container e telas da área do psicólogo.
- `src/components/AppShell.tsx`: barra lateral, cabeçalho e barra inferior, usados pelas duas áreas.
- `src/components/*Screen.tsx`: telas do funcionário.
- `src/utils/schedule.ts`: cálculo das datas das sessões semanais.
- `src/components/Modal.tsx`: base de todos os modais (Esc, clique fora, foco, scroll).
- `src/components/Toast.tsx`: avisos rápidos (`useToast`).
- `src/index.css`: tokens do tema, animações e as classes `.screen` e `.card`.

## Logo

Os arquivos ficam em `public/images/logo/`. Cada formato (`simbolo`, `nome`, `horizontal`, `vertical`) existe em três versões:

- `cor`: o pastel original, para fundos claros e tamanhos grandes;
- `contraste`: mesmos tons com traço sólido, para tamanhos pequenos (é a que o app usa);
- `branco`: para fundos escuros ou com gradiente.

Há também `synapse-original.png` (arte com o fundo creme), os ícones de app (`synapse-icone-*`) e os favicons. O componente `Logo` e a constante `LOGOS` (`src/constants/images.ts`) apontam para as versões usadas no app.

## Termo de Aceite e Privacidade (LGPD)

O texto fica em `src/legal/terms.tsx` e descreve o que o sistema faz hoje com os dados. O aceite é pedido em dois momentos e registrado pela API (versão e data, por conta):

- **No cadastro:** caixa "Li e aceito" e, para funcionários, uma segunda caixa em destaque com o consentimento para dados de saúde (LGPD, art. 11, I).
- **No primeiro acesso** de contas que ainda não aceitaram a versão atual (inclusive as de demonstração): o app só abre depois do aceite.

O termo pode ser lido a qualquer momento pelo rodapé da página inicial e pelo perfil.

Antes de publicar para usuários reais:

- preencha `CONTROLLER` em `src/legal/terms.tsx` (razão social, CNPJ e e-mail do encarregado);
- peça revisão jurídica do texto;
- ao mudar o texto, mude `TERMS_VERSION` no front e em `server/src/config.js`: todos voltam a ser perguntados.

## Foto de perfil

Funcionários e psicólogos escolhem uma imagem no perfil (`PhotoPicker`) e a ajustam em `PhotoEditorModal` (arrastar para posicionar, zoom, e teclado). O app recorta e reduz a foto no navegador para um JPEG de 320×320 e só essa versão vai para a API, guardada na conta. A foto do funcionário aparece para ele e para o psicólogo que o atende; a empresa não a vê. A foto do psicólogo faz parte do perfil público, visto pelos funcionários no diretório.

## Acessibilidade

Todos os cabeçalhos têm um botão de acessibilidade que abre um modal com três ajustes, salvos no navegador:

- **Tamanho das letras** (Normal, Grande, Maior): aumenta só as fontes, sem mexer em espaçamentos, para os layouts continuarem cabendo. Funciona porque os tamanhos de texto são variáveis do tema (`text-xs`, `text-sm`, `text-2xs`...); evite tamanhos fixos como `text-[11px]`, que não acompanham o ajuste. O tamanho Normal já é a escala do Tailwind um degrau acima (texto 12,5% maior, definido no `@theme` do `src/index.css`); Grande e Maior ficam cerca de 15% e 33% acima dele.
- **Ler em voz alta:** fala a opção que recebe foco, é tocada ou acaba de ser selecionada, usando a síntese de fala do próprio navegador (`src/accessibility/speech.ts`). O conteúdo digitado em campos nunca é falado. Depende de o dispositivo ter uma voz instalada; no Linux é preciso `speech-dispatcher` com `espeak-ng`, e o modal avisa quando não há voz.
- **Cores para daltonismo** (Protanopia, Deuteranopia, Tritanopia): corrige as cores da página inteira com filtros SVG. Com um modo ligado, o filtro fica no `<body>` e a página passa a rolar dentro do `#root`; é isso que mantém cabeçalho, navegação e modais fixos, inclusive no Firefox.

O estado fica em `src/accessibility/preferences.tsx`, as matrizes de cor em `src/accessibility/colorVision.tsx` e as regras em `src/index.css`. Para rolar a página por código, use `src/utils/scroll.ts` em vez de `window.scrollTo`.

## Ícones

A fonte Material Symbols é carregada só com os ícones usados. Ao usar um ícone novo, adicione o nome em `icon_names` no `index.html`, em ordem alfabética.
