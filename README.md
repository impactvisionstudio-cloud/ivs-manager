# IVS Manager

**Tudo que a agência precisa em um só lugar.**

Sistema de gestão completo para produtoras audiovisuais: agenda, clientes, CRM,
projetos, equipe, financeiro, equipamentos, contratos, arquivos e a IVS AI.

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. O sistema já funciona de ponta a ponta com
**dados mockados** (`lib/mock/data.ts`) — não é necessário configurar nada
para explorar todas as telas.

### Login de demonstração

Na tela de login, clique em qualquer um dos e-mails de exemplo (senha:
qualquer valor com 6+ caracteres, ex. `1234567`). Cada conta tem um perfil
diferente (Administrador, Gestor, Editor, Designer, Videomaker, Social Media,
Financeiro) com permissões distintas sobre os módulos.

## Conectar ao Supabase (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `DATABASE_URL` (Settings → Database → Connection string → URI)
3. Rode as migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. Substitua as chamadas a `lib/mock/data.ts` pelas consultas via
   `lib/db` (Drizzle) conforme for conectando cada módulo.

## Stack

Next.js 15 · React 19 · TypeScript · TailwindCSS · shadcn/ui (Radix) ·
Supabase · Drizzle ORM · Zod · Zustand · Framer Motion · React Hook Form ·
FullCalendar · Recharts · Lucide Icons

## Estrutura

```
app/
  (auth)/login, forgot-password
  (dashboard)/dashboard, agenda, clientes, crm, projetos, equipe,
              financeiro, equipamentos, contratos, arquivos,
              checklist, notificacoes, ia, configuracoes, perfil
components/
  ui/        — primitivos (Button, Card, Input, Badge, Avatar, Dropdown...)
  layout/    — Sidebar, Topbar, DashboardShell
lib/
  db/        — schema Drizzle + client
  supabase/  — clients browser/server
  store/     — Zustand (auth, ui)
  mock/      — dados de demonstração
  validators/— schemas Zod
types/       — tipos centrais do domínio
```

## O que ainda é simplificado

- CRM e Kanban de projetos: colunas visuais, drag-and-drop ainda não
  conectado (`@dnd-kit` já está nas dependências).
- IVS AI: interface de chat pronta; respostas ainda são mockadas — plugue
  um endpoint `/api/ai` com sua chave de modelo para respostas reais.
- Contratos: sem upload/assinatura digital real ainda.
- Autenticação: mockada via Zustand; a base para Supabase Auth já está em
  `lib/supabase/` para quando quiser trocar.
