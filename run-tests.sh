#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== INICIANDO TESTES DE VALIDAÇÃO E AUTENTICAÇÃO ===${NC}\n"

# Função para cleanup
cleanup() {
  echo -e "\n${YELLOW}Parando servidor...${NC}"
  if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
  fi
  exit $1
}

trap "cleanup 1" INT TERM

# 1. Iniciar servidor em background
echo -e "${YELLOW}1. Iniciando servidor em desenvolvimento...${NC}"
NODE_ENV=test npm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo -e "${GREEN}Servidor iniciado (PID: $SERVER_PID)${NC}"

# 2. Aguardar servidor ficar pronto
echo -e "${YELLOW}2. Aguardando servidor ficar pronto...${NC}"
MAX_RETRIES=40
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}Servidor pronto!${NC}\n"
    break
  fi
  RETRY=$((RETRY + 1))
  echo "  Tentativa $RETRY/$MAX_RETRIES..."
  sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo -e "${RED}Erro: Servidor não respondeu após 30s${NC}"
  cat /tmp/server.log
  cleanup 1
fi

# 3. Executar testes de proteção
echo -e "${BLUE}=== TESTE 1: PROTEÇÃO DE ROTAS (sem token = 401) ===${NC}\n"
BASE_URL=http://localhost:3001 bash test-protection.sh

# 4. Executar teste de autenticação completo
echo -e "\n${BLUE}=== TESTE 2: FLUXO DE AUTENTICAÇÃO ===${NC}\n"
BASE_URL=http://localhost:3001 bash test-auth.sh

echo -e "\n${GREEN}=== TESTES CONCLUÍDOS COM SUCESSO ===${NC}"
cleanup 0
