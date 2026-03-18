# Guilda Maia - ERP + Guild Platform (Fundacao V1)

Base profissional da plataforma web com foco em:

- painel administrativo real;
- autenticacao e autorizacao por perfil/permissao;
- schema inicial ERP (usuarios, categorias, fornecedores, produtos e estoque);
- arquitetura escalavel em camadas para evolucao de ERP + Guilda.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM
- PostgreSQL
- NextAuth (credenciais, sessao JWT)

## Setup local

1. Instalar dependencias:

```bash
npm install
```

2. Criar `.env` a partir do exemplo:

```bash
copy .env.example .env
```

3. Ajustar `DATABASE_URL` no `.env`.

4. Gerar cliente Prisma e sincronizar schema no banco (Neon):

```bash
npm run db:generate
npm run db:push
```

5. Popular dados iniciais (roles, permissoes, admin):

```bash
npm run db:seed
```

6. Iniciar aplicacao:

```bash
npm run dev
```

## Deploy automatico (GitHub + Vercel)

1. Conectar o repositório GitHub ao projeto no Vercel.
2. Configurar variáveis de ambiente no Vercel:
   - `DATABASE_URL` (Neon)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (URL publica do projeto no Vercel)
   - `DEFAULT_ADMIN_EMAIL` (opcional)
   - `DEFAULT_ADMIN_PASSWORD` (opcional)
3. Fazer push na branch monitorada (ex.: `master` ou `main`) para acionar deploy automatico.

## Credenciais iniciais

- Email padrao: `admin@guildamaia.com`
- Senha padrao: `Admin123!`

Pode sobrescrever com:

- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

## Modulos implementados na fundacao

- Dashboard administrativo base
- Usuarios e permissoes
- Categorias
- Fornecedores
- Produtos
- Estoque (movimentacoes com trilha auditavel)
- Caixa (abertura, sangria e fechamento)
- PDV (vendas, pagamento dividido e cancelamento com retorno de estoque)

## Estrutura arquitetural

```
src/
  app/                    # Rotas e layouts
  domain/                 # Contratos e validacoes de dominio
  application/            # Casos de uso e servicos
  infrastructure/         # Repositorios e persistencia
  presentation/           # Server actions e adaptacao de UI
  components/             # Componentes reutilizaveis (admin + shadcn)
  lib/                    # Auth, prisma client e utilitarios
```

## Qualidade

Comandos de validacao:

```bash
npm run lint
npm run build
```
