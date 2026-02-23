# E-commerce API

API REST para e-commerce desenvolvida com **Express.js** e **TypeScript**, utilizando **Sequelize ORM** com **PostgreSQL**. A aplicação oferece autenticação JWT, controle de acesso por roles (admin, customer, delivery), gerenciamento de produtos, categorias, carrinho, pedidos, pagamentos e avaliações.

## Funcionalidades

- Autenticação e autorização com JWT (registro, login, refresh token)
- CRUD de produtos e categorias
- Carrinho de compras
- Sistema de pedidos e pagamentos
- Avaliações de produtos
- Gerenciamento de usuários (admin)
- Rate limiting para proteção contra abuso
- Validação de dados com Joi

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (para o banco de dados PostgreSQL)

## Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd Backend
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto (use o `.env.example` como referência):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=prog_web

# JWT
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=24h

# Environment
NODE_ENV=development
PORT=3000
```

## Como rodar

### Desenvolvimento (recomendado)

1. Suba o banco de dados PostgreSQL com Docker:

```bash
docker compose up -d postgres
```

2. Inicie o servidor de desenvolvimento (com hot reload):

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

### Com Docker Compose (API + banco)

Para subir a API e o banco de dados juntos em containers:

```bash
docker compose up --build
```

### Produção

```bash
npm run build
npm start
```

## Testes

Os testes utilizam **SQLite em memória**, sem necessidade de banco de dados externo.

```bash
# Rodar todos os testes
npm test

# Rodar um arquivo de teste específico
NODE_ENV=test npx jest src/tests/auth.test.ts --runInBand

# Rodar testes por padrão de nome
NODE_ENV=test npx jest --testNamePattern="should register" --runInBand
```

## Endpoints principais

| Recurso       | Rota           | Acesso            |
|---------------|----------------|--------------------|
| Autenticação  | `/auth`        | Público / Protegido |
| Produtos      | `/products`    | Público / Protegido |
| Categorias    | `/categories`  | Público / Protegido |
| Usuários      | `/users`       | Protegido (admin)  |
| Pedidos       | `/orders`      | Protegido          |
| Carrinho      | `/cart`        | Protegido          |
| Pagamentos    | `/payments`    | Protegido          |
| Avaliações    | `/reviews`     | Protegido          |

## Estrutura do projeto

```
src/
├── config/         # Configuração do banco, tratamento de erros, seed do admin
├── controllers/    # Rotas Express (routers)
├── middlewares/     # Middleware de autenticação e validação
├── models/         # Definições dos modelos Sequelize
├── repository/     # Camada de acesso a dados
├── services/       # Camada de lógica de negócio
├── validators/     # Schemas de validação com Joi
└── tests/          # Testes E2E com supertest
```

## Tecnologias

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js 5
- **ORM:** Sequelize 6
- **Banco de dados:** PostgreSQL 16 (SQLite para testes)
- **Autenticação:** JWT + bcrypt
- **Validação:** Joi
- **Testes:** Jest + Supertest
- **Containerização:** Docker + Docker Compose
