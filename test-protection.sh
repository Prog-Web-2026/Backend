#!/bin/bash

# Testes básicos de proteção/validação para endpoints sensíveis
if [ -z "$BASE_URL" ]; then
  BASE_URL="http://localhost:3000"
fi

echo "-- Teste: criar produto sem token (esperado 401) --"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE_URL/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","preco":9.9,"estoque":10}'

echo "-- Teste: criar cliente sem token (esperado 401) --"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE_URL/clientes" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Cliente Teste","email":"x@test.com","senha":"senha123"}'

echo "-- Teste: criar pedido sem token (esperado 401) --"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE_URL/pedidos" \
  -H "Content-Type: application/json" \
  -d '{"id_cliente":1,"id_endereco_entrega":1,"total":10.5}'

echo "
Observação: para testar criação com token, execute o fluxo de registro/login e repita as requisições incluindo o header 'Authorization: Bearer <token>'."
