# Sistema de Autenticação e Validação - Backend

## 📋 Visão Geral

Este documento descreve o sistema de autenticação e validação implementado para garantir que o usuário é quem diz ser através de:

1. **Validação de Dados** - Joi schemas para validar entrada de dados
2. **Hash de Senhas** - Bcrypt para criptografia segura
3. **JWT (JSON Web Tokens)** - Para autenticação sem estado
4. **Middleware de Autenticação** - Para proteger rotas

---

## 🔐 Componentes Principais

### 1. **UserValidator.ts** - Validação de Dados
- Valida estrutura e tipos de dados
- Utiliza Joi para regras de validação
- Esquemas: `createUserSchema`, `loginSchema`, `updateUserSchema`

**Regras de Validação:**
- **Nome**: Min 3, Max 100 caracteres
- **Email**: Formato válido de email
- **Senha**: Min 6, Max 100 caracteres

### 2. **PasswordService.ts** - Criptografia de Senhas
- Hash de senha com bcrypt (10 rounds de salt)
- Comparação segura de senhas
- Senhas nunca são armazenadas em texto plano

### 3. **AuthService.ts** - Gerenciamento de JWT
- Geração de tokens JWT com payload do usuário
- Verificação e validação de tokens
- TTL configurável (padrão: 24h)

### 4. **AuthMiddleware.ts** - Proteção de Rotas
- Middleware `authenticate`: Verifica token em header Authorization
- Middleware `validateRequest`: Valida corpo da requisição
- Injeta dados do usuário em `req.user`

---

## 📡 Endpoints

### Rotas Públicas (Sem Autenticação)

#### 1. **POST /users/register**
Registrar novo usuário

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

#### 2. **POST /users/login**
Autenticar usuário

**Request:**
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

### Rotas Protegidas (Requerem Autenticação)

#### 3. **GET /users**
Listar todos os usuários

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "$2a$10$..." // Hash
  }
]
```

#### 4. **GET /users/:id**
Buscar usuário por ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "$2a$10$..."
}
```

#### 5. **PUT /users/:id**
Atualizar usuário

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "João Silva Atualizado",
  "password": "novaSenha123"
}
```

**Response (200):**
```json
{
  "message": "Usuário atualizado com sucesso",
  "user": { ... }
}
```

#### 6. **DELETE /users/:id**
Deletar usuário

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

---

## 🔄 Fluxo de Autenticação

```
1. Usuário faz POST /users/register com credenciais
   ↓
2. Middleware validateRequest valida dados
   ↓
3. UserService.create() é chamado
   ↓
4. Senha é hashada com bcrypt (PasswordService)
   ↓
5. Usuário é salvo no banco de dados
   ↓
6. Usuário faz POST /users/login com email/senha
   ↓
7. Middleware validateRequest valida dados
   ↓
8. UserService.login() compara senha com hash
   ↓
9. Se válido, JWT é gerado com id e email do usuário
   ↓
10. Token é retornado ao cliente
    ↓
11. Cliente usa token em header Authorization: Bearer <token>
    ↓
12. Middleware authenticate verifica validade do token
    ↓
13. req.user é populado e rota protegida é acessada
```

---

## ⚙️ Configuração

### 1. **Variáveis de Ambiente (.env)**

```env
JWT_SECRET=sua-chave-secreta-super-segura-mude-isso-em-producao
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=3000
```

### 2. **Instalação de Dependências**

```bash
npm install jsonwebtoken bcryptjs joi @types/jsonwebtoken
```

---

## 🛡️ Segurança

### Boas Práticas Implementadas

1. ✅ **Hash de Senhas**: Bcrypt com 10 rounds de salt
2. ✅ **Tokens JWT**: Sem estado, assinados e verificáveis
3. ✅ **Validação de Entrada**: Joi schemas em todas as rotas
4. ✅ **Proteção de Rotas**: Middleware de autenticação
5. ✅ **Email Único**: Validação de email duplicado
6. ✅ **Mensagens de Erro Genéricas**: "Email ou senha incorretos" (não revela se email existe)
7. ✅ **Rate Limiting**: Já implementado no index.ts

### Recomendações Adicionais

1. 🔒 Use HTTPS em produção
2. 🔑 Rotação de JWT_SECRET periodicamente
3. 📝 Implementar logs de autenticação
4. 🚨 Implementar 2FA (Two-Factor Authentication)
5. ⏰ Rate limiting mais agressivo para login
6. 🗑️ Implementar blacklist de tokens revogados

---

## 🧪 Testes com cURL

### 1. Registrar Usuário

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### 3. Acessar Rota Protegida

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer <seu_token_aqui>"
```

---

## 📊 Estrutura de Arquivos

```
src/
├── middleware/
│   └── AuthMiddleware.ts       # Middlewares de autenticação e validação
├── services/
│   ├── AuthService.ts          # Gerenciamento de JWT
│   ├── PasswordService.ts      # Hash e comparação de senhas
│   └── UserService.ts          # Lógica de negócio (incluindo login)
├── validators/
│   └── UserValidator.ts        # Schemas de validação com Joi
├── controllers/
│   └── UserController.ts       # Endpoints HTTP
├── routes/
│   └── UserRoutes.ts           # Definição de rotas
└── repository/
    └── UserRepository.ts       # Acesso ao banco de dados
```

---

## 🚀 Próximos Passos

1. Aplicar validação similar em outros modelos (Cliente, Produto, etc)
2. Implementar refresh tokens para melhor segurança
3. Adicionar logs de auditoria
4. Implementar 2FA
5. Adicionar rate limiting mais sofisticado
6. Implementar webhook de eventos de autenticação
