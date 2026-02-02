#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}=== TESTES DE AUTENTICAÇÃO E VALIDAÇÃO ===${NC}\n"

# 1. Registrar novo usuário
echo -e "${YELLOW}1. Registrando novo usuário...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# 2. Tentar registrar com dados inválidos
echo -e "${YELLOW}2. Tentando registrar com email inválido...${NC}"
INVALID_EMAIL=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria",
    "email": "email-invalido",
    "password": "senha123"
  }')

echo "$INVALID_EMAIL" | jq '.'
echo ""

# 3. Fazer login
echo -e "${YELLOW}3. Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo -e "${GREEN}Token obtido: ${TOKEN:0:50}...${NC}\n"

# 4. Listar usuários com token válido
echo -e "${YELLOW}4. Listando usuários com token válido...${NC}"
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 5. Tentar acessar sem token
echo -e "${YELLOW}5. Tentando acessar sem token...${NC}"
curl -s -X GET "$BASE_URL/users" | jq '.'
echo ""

# 6. Tentar login com senha errada
echo -e "${YELLOW}6. Tentando login com senha errada...${NC}"
curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha-errada"
  }' | jq '.'
echo ""

echo -e "${GREEN}=== TESTES CONCLUÍDOS ===${NC}"
