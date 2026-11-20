# TODO LIST

Aplicação desenvolvida para estudos de React, agora com backend próprio.

Cada pessoa tem sua conta, organiza tarefas em listas e escolhe entre o tema claro e o escuro.

- **Web:** React 19 + TypeScript + Vite + React Router
- **API:** [Hono](https://hono.dev/) rodando no Node.js
- **Banco:** SQLite via `node:sqlite`, nativo do Node (sem driver extra)
- **Testes:** Vitest (+ Testing Library no front)

## Requisitos

- Node.js 24 ou superior (o `node:sqlite` e a execução direta de TypeScript vêm do próprio Node)

## Rodando o projeto

```bash
npm install
npm run dev
```

O comando sobe os dois apps juntos:

| App | Endereço                |
| --- | ----------------------- |
| Web | `http://localhost:5173` |
| API | `http://localhost:3333` |

Em desenvolvimento, o Vite repassa as chamadas de `/api` para a API. Assim front e API ficam na mesma origem e o cookie de sessão funciona sem configurar CORS.

O banco é criado automaticamente em `apps/api/data/app.db` na primeira execução.

### Variáveis de ambiente (opcionais)

| Variável   | App | Padrão                  | Uso                                           |
| ---------- | --- | ----------------------- | --------------------------------------------- |
| `PORT`     | API | `3333`                  | Porta da API                                  |
| `DB_PATH`  | API | `apps/api/data/app.db`  | Caminho do arquivo SQLite                     |
| `API_URL`  | Web | `http://localhost:3333` | Para onde o Vite encaminha as chamadas `/api` |
| `NODE_ENV` | API |                         | Em `production`, o cookie é marcado `Secure`  |

## Scripts

Na raiz:

```bash
npm run dev    # API + web em modo desenvolvimento
npm test       # testes dos dois apps
npm run lint   # ESLint em todo o repositório
npm run build  # typecheck da API e build do web
```

Para rodar algo em um app só, use `-w`, por exemplo `npm test -w @todo-list/api`.

## Estrutura

```text
apps/
  api/
    src/
      routes/       Rotas de auth, listas e tarefas (com os testes ao lado)
      middleware/   requireAuth: valida o cookie de sessão
      lib/          Senha (scrypt), sessão e validação
      db.ts         Conexão e schema do SQLite
      app.ts        Monta o app Hono (usado também nos testes)
      index.ts      Sobe o servidor
  web/
    src/
      pages/        Login, cadastro, listas e tarefas
      components/   Layouts, linhas de lista/tarefa e formulários
      contexts/     Autenticação e tema
      hooks/        useAuth e useTheme
      services/     Cliente HTTP da API
      types/        Tipos compartilhados
```

## API

Todas as rotas ficam sob `/api` e respondem JSON. Erros seguem o formato `{ "error": "mensagem" }`.

| Método | Rota                    | Descrição                                   |
| ------ | ----------------------- | ------------------------------------------- |
| POST   | `/auth/register`        | Cria a conta e já inicia a sessão           |
| POST   | `/auth/login`           | Inicia a sessão                             |
| POST   | `/auth/logout`          | Encerra a sessão                            |
| GET    | `/auth/me`              | Usuário da sessão atual                     |
| GET    | `/lists`                | Listas do usuário, com totais de tarefas    |
| POST   | `/lists`                | Cria uma lista                              |
| GET    | `/lists/:id`            | Detalhes de uma lista                       |
| PATCH  | `/lists/:id`            | Renomeia uma lista                          |
| DELETE | `/lists/:id`            | Exclui a lista e suas tarefas               |
| GET    | `/lists/:id/tasks`      | Tarefas de uma lista                        |
| POST   | `/lists/:id/tasks`      | Cria uma tarefa                             |
| PATCH  | `/tasks/:id`            | Edita o texto e/ou marca como concluída     |
| DELETE | `/tasks/:id`            | Exclui uma tarefa                           |

Exceto as de cadastro, login e logout, todas exigem sessão. Listas e tarefas de outra pessoa respondem `404`.

### Autenticação

A sessão fica em um cookie `httpOnly` com `SameSite=Lax`, válido por 30 dias. O banco guarda apenas o hash do token, e as senhas são armazenadas com `scrypt` e salt aleatório. Sair da conta apaga a sessão no servidor.

## Build de produção

```bash
npm run build
npm run preview -w @todo-list/web
```

Os arquivos do front são gerados em `apps/web/dist/`. A API roda direto do TypeScript com `npm start -w @todo-list/api`.
