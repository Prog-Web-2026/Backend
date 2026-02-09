#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$BASE_URL" ]; then
  BASE_URL="http://localhost:3000"
fi

# Email único por execução para evitar conflitos
TIMESTAMP=$(date +%s%N)
TEST_EMAIL="joao${TIMESTAMP:0:10}@example.com"

echo -e "${BLUE}=== TESTES DE AUTENTICAÇÃO E VALIDAÇÃO ===${NC}\n"
echo -e "${BLUE}Email de teste: $TEST_EMAIL${NC}\n"

# 1. Registrar novo usuário
echo -e "${YELLOW}1. Registrando novo usuário...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "'$TEST_EMAIL'",
    "password": "senha123"
  }')

echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""
sleep 1.5

# 2. Tentar registrar com dados inválidos
echo -e "${YELLOW}2. Tentando registrar com email inválido...${NC}"
INVALID_EMAIL=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria",
    "email": "email-invalido",
    "password": "senha123"
  }')

echo "$INVALID_EMAIL" | jq '.' 2>/dev/null || echo "$INVALID_EMAIL"
echo ""
sleep 1.5

# 3. Fazer login
echo -e "${YELLOW}3. Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "senha123"
  }')

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
echo -e "${GREEN}Token obtido (primeiros 50 chars): ${TOKEN:0:50}...${NC}\n"
sleep 1.5
# 4. Listar usuários com token válido
echo -e "${YELLOW}4. Listando usuários com token válido...${NC}"
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "(sem saída JSON)"
echo ""
sleep 1.5

# 5. Tentar acessar sem token
echo -e "${YELLOW}5. Tentando acessar sem token...${NC}"
curl -s -X GET "$BASE_URL/users" | jq '.' 2>/dev/null || echo "(sem saída JSON)"
echo ""
sleep 1.5

# 6. Tentar login com senha errada
echo -e "${YELLOW}6. Tentando login com senha errada...${NC}"
curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "senha-errada"
  }' | jq '.' 2>/dev/null || echo "(sem saída JSON)"
echo ""

echo -e "${GREEN}=== TESTES CONCLUÍDOS ===${NC}"
