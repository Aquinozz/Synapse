# Synapse

Plano de saúde mental para empresas:

- a **empresa** paga R$ 100 por funcionário ao mês;
- o **funcionário** tem 1 sessão por semana com um psicólogo fixo;
- o **psicólogo** paga R$ 80 ao mês para estar na plataforma e recebe um repasse por sessão.

Esses valores ficam em `src/config/pricing.ts` (front) e `server/src/config.js` (API). O repasse por sessão (`sessionPayout`) ainda é provisório.

Front end em React 19 + Vite + Tailwind CSS v4 + React Router, ligado à API de `server/`.

## Áreas

| Rota | O que é |
| --- | --- |
| `/` | Página pública com preços e chamadas para empresas e psicólogos |
| `/entrar` | Login e cadastro (funcionário ou psicólogo) |
| `/app/*` | Funcionário: início, bem-estar, terapeutas, Synapse AI e check-in |
| `/psi/*` | Psicólogo: início, agenda, pacientes, financeiro e perfil |

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
npm test               # 23 testes
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
| `POST /api/auth/logout`, `GET /api/auth/me` | logado | Encerra a sessão / dados do usuário |
| `GET /api/psychologists`, `GET /api/psychologists/:id` | logado | Psicólogos ativos com os horários semanais livres (`?search=`) |
| `GET /api/plan` | funcionário | Psicólogo e horário fixos, próxima sessão |
| `PUT /api/plan` | funcionário | Escolhe ou troca psicólogo e horário fixo |
| `POST /api/plan/reschedule` | funcionário | Remarca só a sessão desta semana |
| `GET /api/psi/availability`, `PUT /api/psi/availability` | psicólogo | Horários semanais oferecidos |
| `GET /api/psi/patients` | psicólogo | Pacientes com horário fixo |
| `GET /api/psi/profile`, `PUT /api/psi/profile` | psicólogo | Perfil público (apresentação e especialidades) |
| `GET /api/pricing`, `GET /api/health` | público | Preços do plano / verificação |

As requisições autenticadas levam o cabeçalho `Authorization: Bearer <token>`. Erros voltam como `{ "error": { "code", "message" } }`.

Regras que a API garante: um horário fixo pertence a um funcionário só; a remarcação vale apenas dentro da semana atual e antes de a sessão acontecer; o psicólogo não consegue fechar um horário que tem paciente; psicólogo recém-cadastrado fica oculto até ser aprovado (`npm run approve -- email`).

Em desenvolvimento, o Vite encaminha `/api` para a porta 4000, então rode a API e o front ao mesmo tempo (`npm run dev:api` e `npm run dev`). Para apontar o front para outra API, use a variável `API_TARGET`.

### O que o front já busca na API e o que ainda é simulado

| Vem da API | Ainda simulado no front |
| --- | --- |
| Login, cadastro e sessão | Check-in diário e índice de bem-estar |
| Psicólogos e horários livres | Evolução semanal e "dias ativos" |
| Sessão semanal (escolher, trocar, remarcar) | Sugestões da Synapse AI |
| Perfil, agenda e pacientes do psicólogo | Anotações de pacientes (ficam no navegador) |
| | Financeiro do psicólogo (estimativa pela agenda) |

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

## Ícones

A fonte Material Symbols é carregada só com os ícones usados. Ao usar um ícone novo, adicione o nome em `icon_names` no `index.html`, em ordem alfabética.
