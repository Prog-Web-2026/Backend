#!/bin/bash

# test-ecommerce-system-final.sh
# Script final corrigido para testar todas as rotas

# Configurações
BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@exemplo.com"
ADMIN_PASSWORD="senha123"

# Variáveis para armazenar IDs
ADMIN_TOKEN=""
CUSTOMER_TOKEN=""
DELIVERY_TOKEN=""
USER_ID=""
CATEGORY_ID=""
PRODUCT_ID=""
CART_ITEM_ID=""
ORDER_ID=""
PAYMENT_ID=""
REVIEW_ID=""
PAYMENT_METHOD_ID=""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Funções auxiliares
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local token="$5"
    
    local curl_cmd="curl -s -X $method '$BASE_URL$endpoint'"
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ ! -z "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    curl_cmd="$curl_cmd -w '|%{http_code}'"
    
    local response=$(eval $curl_cmd 2>/dev/null)
    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | awk -F'|' '{print $1}')
    
    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        print_success "$name (HTTP $http_code)"
        echo "$body" | head -c 200
        echo ""
        return 0
    else
        print_error "$name (HTTP $http_code)"
        echo "Resposta: $body" | head -c 300
        echo ""
        return 1
    fi
}

extract_id() {
    echo "$1" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

extract_token() {
    echo "$1" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

wait_for_input() {
    read -p "Pressione Enter para continuar..."
}

# =========================================
# 1. TESTES DE AUTENTICAÇÃO
# =========================================
test_auth() {
    print_header "1. TESTES DE AUTENTICAÇÃO"
    
    # Login como admin
    print_info "Fazendo login como administrador..."
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    ADMIN_TOKEN=$(extract_token "$response")
    
    if [ -n "$ADMIN_TOKEN" ]; then
        print_success "Login admin realizado com sucesso"
        echo "Token: ${ADMIN_TOKEN:0:20}..."
    else
        print_error "Falha no login admin"
        exit 1
    fi
    
    # Verificar token
    test_endpoint "Verificar Token" "POST" "/auth/verify" "" "$ADMIN_TOKEN"
    
    # Verificar autenticação
    test_endpoint "Verificar Autenticação" "GET" "/auth/check" "" "$ADMIN_TOKEN"
    
    # Verificar role
    test_endpoint "Verificar Role" "GET" "/auth/role" "" "$ADMIN_TOKEN"
    
    # Buscar usuário atual
    test_endpoint "Buscar Usuário Atual" "GET" "/auth/me" "" "$ADMIN_TOKEN"
    
    # Refresh token
    test_endpoint "Refresh Token" "POST" "/auth/refresh" "" "$ADMIN_TOKEN"
    
    wait_for_input
}

# =========================================
# 2. TESTES DE USUÁRIO (ADMIN)
# =========================================
test_users_admin() {
    print_header "2. TESTES DE USUÁRIO (ADMIN)"
    
    # Listar todos os usuários
    test_endpoint "Listar Todos Usuários" "GET" "/users" "" "$ADMIN_TOKEN"
    
    # Buscar usuário admin por ID
    USER_ID=1
    test_endpoint "Buscar Usuário por ID" "GET" "/users/$USER_ID" "" "$ADMIN_TOKEN"
    
    # Atualizar usuário admin
    test_endpoint "Atualizar Usuário Admin" "PUT" "/users/$USER_ID" \
        "{\"name\":\"Admin Atualizado\",\"phone\":\"(11) 99999-0000\"}" \
        "$ADMIN_TOKEN"
    
    wait_for_input
}

# =========================================
# 3. TESTES DE CATEGORIA - CORRIGIDO
# =========================================
test_categories() {
    print_header "3. TESTES DE CATEGORIA"
    
    # Criar categoria
    print_info "Criando nova categoria..."
    response=$(curl -s -X POST "$BASE_URL/categories" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "name": "Eletrônicos de Teste",
            "description": "Categoria para testes do sistema",
            "isActive": true
        }')
    
    CATEGORY_ID=$(extract_id "$response")
    
    if [ -n "$CATEGORY_ID" ]; then
        print_success "Categoria criada com ID: $CATEGORY_ID"
    else
        print_error "Falha ao criar categoria"
        CATEGORY_ID=1
        print_info "Usando ID de categoria padrão: $CATEGORY_ID"
    fi
    
    # Listar categorias
    test_endpoint "Listar Categorias" "GET" "/categories" "" ""
    
    # Buscar categoria por ID
    test_endpoint "Buscar Categoria por ID" "GET" "/categories/$CATEGORY_ID" "" ""
    
    # Atualizar categoria
    test_endpoint "Atualizar Categoria" "PUT" "/categories/$CATEGORY_ID" \
        "{\"name\":\"Eletrônicos Atualizados\"}" \
        "$ADMIN_TOKEN"
    
    # Categorias populares (pode falhar se não houver produtos)
    test_endpoint "Categorias Populares" "GET" "/categories/popular?limit=3" "" ""
    
    wait_for_input
}

# =========================================
# 4. TESTES DE PRODUTO - CORRIGIDO
# =========================================
test_products() {
    print_header "4. TESTES DE PRODUTO"
    
    # SEMPRE tentar criar produto, mesmo que CATEGORY_ID seja 1
    print_info "Criando novo produto..."
    response=$(curl -s -X POST "$BASE_URL/products" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"name\": \"Smartphone Teste $RANDOM\",
            \"description\": \"Produto para testes do sistema\",
            \"price\": 99.99,
            \"stock\": 100,
            \"categoryId\": $CATEGORY_ID,
            \"isActive\": true
        }")
    
    PRODUCT_ID=$(extract_id "$response")
    
    if [ -n "$PRODUCT_ID" ]; then
        print_success "Produto criado com ID: $PRODUCT_ID"
    else
        print_error "Falha ao criar produto"
        echo "Resposta: $response"
        
        # Tentar criar produto mais simples
        response=$(curl -s -X POST "$BASE_URL/products" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "{
                \"name\": \"Produto Simples\",
                \"price\": 50,
                \"categoryId\": $CATEGORY_ID
            }")
        
        PRODUCT_ID=$(extract_id "$response")
        if [ -n "$PRODUCT_ID" ]; then
            print_success "Produto simples criado com ID: $PRODUCT_ID"
        else
            print_error "Falha ao criar produto simples também"
            PRODUCT_ID=1
        fi
    fi
    
    # Listar produtos
    test_endpoint "Listar Produtos" "GET" "/products" "" ""
    
    # Buscar produto por ID
    test_endpoint "Buscar Produto por ID" "GET" "/products/$PRODUCT_ID" "" ""
    
    # Buscar produto com reviews
    test_endpoint "Buscar Produto com Reviews" "GET" "/products/$PRODUCT_ID?includeReviews=true" "" ""
    
    # Atualizar produto
    test_endpoint "Atualizar Produto" "PUT" "/products/$PRODUCT_ID" \
        "{\"name\":\"Produto Atualizado\",\"price\":89.99}" \
        "$ADMIN_TOKEN"
    
    # Atualizar estoque
    test_endpoint "Atualizar Estoque" "PATCH" "/products/$PRODUCT_ID/stock" \
        "{\"quantity\":50,\"operation\":\"add\"}" \
        "$ADMIN_TOKEN"
    
    # Buscar por categoria
    test_endpoint "Produtos por Categoria" "GET" "/products?categoryId=$CATEGORY_ID" "" ""
    
    # Buscar produtos
    test_endpoint "Buscar Produtos" "GET" "/products/search?q=teste" "" ""
    
    wait_for_input
}

# =========================================
# 5. REGISTRO E LOGIN DE CLIENTE - CORRIGIDO
# =========================================
test_customer_auth() {
    print_header "5. REGISTRO E LOGIN DE CLIENTE"
    
    local timestamp=$(date +%s)
    local customer_email="cliente_${timestamp}@teste.com"
    
    # Registrar cliente
    print_info "Registrando novo cliente: $customer_email"
    response=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Cliente Teste\",
            \"email\": \"$customer_email\",
            \"password\": \"senha123\",
            \"phone\": \"(11) 99999-9999\"
        }")
    
    CUSTOMER_TOKEN=$(extract_token "$response")
    USER_ID=$(extract_id "$response")
    
    if [ -n "$CUSTOMER_TOKEN" ]; then
        print_success "Cliente registrado com sucesso"
        echo "User ID: $USER_ID"
    else
        print_error "Falha ao registrar cliente"
        # Usar cliente existente
        USER_ID=2
        print_info "Usando cliente existente com ID: $USER_ID"
    fi
    
    # Login do cliente
    print_info "Fazendo login como cliente..."
    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$customer_email\",\"password\":\"senha123\"}")
    
    CUSTOMER_TOKEN=$(extract_token "$response")
    
    if [ -n "$CUSTOMER_TOKEN" ]; then
        print_success "Login cliente realizado com sucesso"
    else
        print_error "Falha no login cliente"
        # Tentar login com cliente padrão
        response=$(curl -s -X POST "$BASE_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"cliente@teste.com\",\"password\":\"senha123\"}")
        CUSTOMER_TOKEN=$(extract_token "$response")
    fi
    
    # Atualizar endereço do cliente com endereço SIMPLES que funciona
    print_info "Adicionando endereço ao cliente (endereço simples)..."
    test_endpoint "Atualizar Endereço Simples" "PUT" "/users/me/address" \
        '{
            "street": "Av Paulista",
            "number": "1000",
            "neighborhood": "Bela Vista",
            "city": "São Paulo",
            "state": "SP",
            "zipCode": "01310-100"
        }' \
        "$CUSTOMER_TOKEN"
    
    wait_for_input
}

# =========================================
# 6. TESTES DE CARRINHO - CORRIGIDO
# =========================================
test_cart() {
    print_header "6. TESTES DE CARRINHO"
    
    if [ -z "$PRODUCT_ID" ]; then
        print_error "Produto não disponível para teste do carrinho"
        return
    fi
    
    # Adicionar ao carrinho
    print_info "Adicionando produto ao carrinho..."
    response=$(curl -s -X POST "$BASE_URL/cart" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "{
            \"productId\": $PRODUCT_ID,
            \"quantity\": 2
        }")
    
    CART_ITEM_ID=$(extract_id "$response")
    
    if [ -n "$CART_ITEM_ID" ]; then
        print_success "Item adicionado ao carrinho com ID: $CART_ITEM_ID"
    else
        print_error "Falha ao adicionar ao carrinho"
        echo "Resposta: $response"
        return
    fi
    
    # Ver carrinho
    test_endpoint "Ver Carrinho" "GET" "/cart" "" "$CUSTOMER_TOKEN"
    
    # Calcular total
    test_endpoint "Calcular Total do Carrinho" "GET" "/cart/total" "" "$CUSTOMER_TOKEN"
    
    # Verificar disponibilidade
    test_endpoint "Verificar Disponibilidade" "GET" "/cart/availability" "" "$CUSTOMER_TOKEN"
    
    # Atualizar item do carrinho
    test_endpoint "Atualizar Item do Carrinho" "PUT" "/cart/$CART_ITEM_ID" \
        "{\"quantity\": 3}" \
        "$CUSTOMER_TOKEN"
    
    # Fazer checkout (selecionar itens)
    test_endpoint "Checkout do Carrinho" "POST" "/cart/checkout" \
        "{\"selectedCartItemIds\": [$CART_ITEM_ID]}" \
        "$CUSTOMER_TOKEN"
    
    wait_for_input
}

# =========================================
# 7. TESTES DE PEDIDO - CORRIGIDO
# =========================================
test_orders() {
    print_header "7. TESTES DE PEDIDO"
    
    if [ -z "$CART_ITEM_ID" ]; then
        print_error "Não há itens no carrinho para criar pedido"
        return
    fi
    
    # Criar pedido
    print_info "Criando pedido a partir dos itens do carrinho..."
    response=$(curl -s -X POST "$BASE_URL/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "{
            \"selectedCartItemIds\": [$CART_ITEM_ID],
            \"notes\": \"Pedido de teste do sistema\"
        }")
    
    ORDER_ID=$(extract_id "$response")
    
    if [ -n "$ORDER_ID" ]; then
        print_success "Pedido criado com ID: $ORDER_ID"
    else
        print_error "Falha ao criar pedido"
        ORDER_ID=1
    fi
    
    # Buscar pedido por ID
    test_endpoint "Buscar Pedido por ID" "GET" "/orders/$ORDER_ID" "" "$CUSTOMER_TOKEN"
    
    # Listar pedidos do usuário
    test_endpoint "Listar Pedidos do Usuário" "GET" "/orders" "" "$CUSTOMER_TOKEN"
    
    # Atualizar status do pedido (admin)
    test_endpoint "Atualizar Status para Confirmado" "PATCH" "/orders/$ORDER_ID/status" \
        "{\"status\": \"confirmed\"}" \
        "$ADMIN_TOKEN"
    
    # Estatísticas de pedidos (admin)
    test_endpoint "Estatísticas de Pedidos" "GET" "/orders/stats" "" "$ADMIN_TOKEN"
    
    wait_for_input
}

# =========================================
# 8. TESTES DE PAGAMENTO - CORRIGIDO
# =========================================
test_payments() {
    print_header "8. TESTES DE PAGAMENTO"
    
    # Adicionar método de pagamento
    print_info "Adicionando método de pagamento..."
    response=$(curl -s -X POST "$BASE_URL/users/me/payment-methods" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d '{
            "type": "credit_card",
            "cardHolderName": "CLIENTE TESTE",
            "cardNumber": "4111111111111111",
            "cardExpiryMonth": 12,
            "cardExpiryYear": 2030,
            "cardCvv": "123"
        }')
    
    PAYMENT_METHOD_ID=$(extract_id "$response")
    
    if [ -n "$PAYMENT_METHOD_ID" ]; then
        print_success "Método de pagamento criado com ID: $PAYMENT_METHOD_ID"
    else
        print_error "Falha ao criar método de pagamento"
        PAYMENT_METHOD_ID=1
    fi
    
    # Processar pagamento do pedido
    print_info "Processando pagamento do pedido..."
    response=$(curl -s -X POST "$BASE_URL/orders/$ORDER_ID/payment" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "{
            \"type\": \"credit_card\",
            \"paymentMethodId\": $PAYMENT_METHOD_ID,
            \"installments\": 1
        }")
    
    PAYMENT_ID=$(extract_id "$response")
    
    if [ -n "$PAYMENT_ID" ]; then
        print_success "Pagamento processado com ID: $PAYMENT_ID"
    else
        print_error "Falha ao processar pagamento"
        PAYMENT_ID=1
    fi
    
    # Buscar pagamento por ID
    test_endpoint "Buscar Pagamento por ID" "GET" "/payments/$PAYMENT_ID" "" "$CUSTOMER_TOKEN"
    
    # Buscar pagamento por pedido
    test_endpoint "Buscar Pagamento por Pedido" "GET" "/payments/order/$ORDER_ID" "" "$CUSTOMER_TOKEN"
    
    # Listar pagamentos do usuário
    test_endpoint "Listar Pagamentos do Usuário" "GET" "/payments/user" "" "$CUSTOMER_TOKEN"
    
    wait_for_input
}

# =========================================
# 9. TESTES DE AVALIAÇÃO - CORRIGIDO
# =========================================
test_reviews() {
    print_header "9. TESTES DE AVALIAÇÃO"
    
    if [ -z "$ORDER_ID" ]; then
        print_error "Não há pedido para marcar como entregue"
        return
    fi
    
    # Primeiro, marcar pedido como entregue
    test_endpoint "Marcar Pedido como Entregue" "PATCH" "/orders/$ORDER_ID/status" \
        "{\"status\": \"delivered\"}" \
        "$ADMIN_TOKEN"
    
    # Aguardar um momento
    sleep 2
    
    # Adicionar avaliação
    print_info "Adicionando avaliação do produto..."
    response=$(curl -s -X POST "$BASE_URL/product-reviews/product/$PRODUCT_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d '{
            "rating": 5,
            "comment": "Excelente produto! Chegou rapidamente."
        }')
    
    REVIEW_ID=$(extract_id "$response")
    
    if [ -n "$REVIEW_ID" ]; then
        print_success "Avaliação criada com ID: $REVIEW_ID"
    else
        print_error "Falha ao criar avaliação"
        REVIEW_ID=1
    fi
    
    # Listar avaliações do produto
    test_endpoint "Listar Avaliações do Produto" "GET" "/product-reviews/product/$PRODUCT_ID" "" ""
    
    # Estatísticas de avaliações
    test_endpoint "Estatísticas de Avaliações" "GET" "/product-reviews/product/$PRODUCT_ID/stats" "" ""
    
    # Buscar avaliação por ID
    test_endpoint "Buscar Avaliação por ID" "GET" "/product-reviews/$REVIEW_ID" "" "$CUSTOMER_TOKEN"
    
    # Atualizar avaliação
    test_endpoint "Atualizar Avaliação" "PUT" "/product-reviews/$REVIEW_ID" \
        "{\"rating\": 4, \"comment\": \"Muito bom\"}" \
        "$CUSTOMER_TOKEN"
    
    wait_for_input
}

# =========================================
# 10. TESTES DE USUÁRIO (CLIENTE) - CORRIGIDO
# =========================================
test_user_operations() {
    print_header "10. TESTES DE USUÁRIO (CLIENTE)"
    
    if [ -z "$USER_ID" ]; then
        print_error "Usuário não disponível"
        return
    fi
    
    # Buscar usuário por ID
    test_endpoint "Buscar Usuário por ID" "GET" "/users/$USER_ID" "" "$CUSTOMER_TOKEN"
    
    # Atualizar usuário
    test_endpoint "Atualizar Usuário" "PUT" "/users/$USER_ID" \
        "{\"name\": \"Cliente Atualizado\", \"phone\": \"(11) 98888-8888\"}" \
        "$CUSTOMER_TOKEN"
    
    # Alterar senha
    test_endpoint "Alterar Senha" "PUT" "/users/me/password" \
        "{\"currentPassword\": \"senha123\", \"newPassword\": \"novaSenha123\"}" \
        "$CUSTOMER_TOKEN"
    
    # Reverter senha
    test_endpoint "Reverter Senha" "PUT" "/users/me/password" \
        "{\"currentPassword\": \"novaSenha123\", \"newPassword\": \"senha123\"}" \
        "$CUSTOMER_TOKEN"
    
    # Listar métodos de pagamento
    test_endpoint "Listar Métodos de Pagamento" "GET" "/users/me/payment-methods" "" "$CUSTOMER_TOKEN"
    
    # Alternar status do usuário (admin)
    test_endpoint "Desativar Usuário" "PATCH" "/users/$USER_ID/status" \
        "{\"isActive\": false}" \
        "$ADMIN_TOKEN"
    
    test_endpoint "Reativar Usuário" "PATCH" "/users/$USER_ID/status" \
        "{\"isActive\": true}" \
        "$ADMIN_TOKEN"
    
    wait_for_input
}

# =========================================
# 11. TESTES DE ENTREGADOR
# =========================================
test_delivery() {
    print_header "11. TESTES DE ENTREGADOR"
    
    local timestamp=$(date +%s)
    local delivery_email="entregador_${timestamp}@teste.com"
    
    # Registrar entregador
    print_info "Registrando novo entregador: $delivery_email"
    response=$(curl -s -X POST "$BASE_URL/auth/delivery/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Entregador Teste\",
            \"email\": \"$delivery_email\",
            \"password\": \"senha123\",
            \"phone\": \"(11) 97777-7777\"
        }")
    
    DELIVERY_TOKEN=$(extract_token "$response")
    
    if [ -n "$DELIVERY_TOKEN" ]; then
        print_success "Entregador registrado com sucesso"
    else
        print_error "Falha ao registrar entregador"
    fi
    
    # Login entregador
    print_info "Fazendo login como entregador..."
    response=$(curl -s -X POST "$BASE_URL/auth/delivery/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$delivery_email\",\"password\":\"senha123\"}")
    
    DELIVERY_TOKEN=$(extract_token "$response")
    
    if [ -n "$DELIVERY_TOKEN" ]; then
        print_success "Login entregador realizado com sucesso"
    else
        print_error "Falha no login entregador"
    fi
    
    # Verificar role do entregador
    test_endpoint "Verificar Role do Entregador" "GET" "/auth/role" "" "$DELIVERY_TOKEN"
    
    wait_for_input
}

# =========================================
# 12. TESTES ADICIONAIS - SIMPLIFICADOS
# =========================================
test_additional() {
    print_header "12. TESTES ADICIONAIS"
    
    # Limpar carrinho
    test_endpoint "Limpar Carrinho" "DELETE" "/cart" "" "$CUSTOMER_TOKEN"
    
    # Remover item do carrinho (se existir)
    if [ -n "$CART_ITEM_ID" ]; then
        test_endpoint "Remover Item do Carrinho" "DELETE" "/cart/$CART_ITEM_ID" "" "$CUSTOMER_TOKEN"
    fi
    
    # Testar exclusão de produto (admin) - apenas se produto existe
    if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "1" ]; then
        test_endpoint "Excluir Produto" "DELETE" "/products/$PRODUCT_ID" "" "$ADMIN_TOKEN"
    fi
    
    # Testar exclusão de categoria (admin) - apenas se categoria existe
    if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "1" ]; then
        test_endpoint "Excluir Categoria" "DELETE" "/categories/$CATEGORY_ID" "" "$ADMIN_TOKEN"
    fi
    
    wait_for_input
}

# =========================================
# FUNÇÃO PRINCIPAL
# =========================================
main() {
    clear
    
    echo -e "${BLUE}🛒 SISTEMA E-COMMERCE - TESTE DE ROTAS COMPLETO${NC}"
    echo -e "${BLUE}================================================${NC}\n"
    
    echo -e "${YELLOW}Este script testará todas as rotas do sistema seguindo um fluxo completo:${NC}"
    echo "1. Autenticação"
    echo "2. Usuários (Admin)"
    echo "3. Categorias"
    echo "4. Produtos"
    echo "5. Registro de Cliente"
    echo "6. Carrinho"
    echo "7. Pedidos"
    echo "8. Pagamentos"
    echo "9. Avaliações"
    echo "10. Operações de Usuário"
    echo "11. Entregador"
    echo "12. Testes Adicionais"
    echo ""
    echo -e "${YELLOW}Credenciais padrão:${NC}"
    echo "  Admin: $ADMIN_EMAIL / $ADMIN_PASSWORD"
    echo ""
    echo -e "${RED}Certifique-se de que o servidor está rodando em $BASE_URL${NC}"
    echo ""
    
    read -p "Pressione Enter para iniciar os testes..."
    
    # Executar todos os testes
    test_auth
    test_users_admin
    test_categories
    test_products
    test_customer_auth
    test_cart
    test_orders
    test_payments
    test_reviews
    test_user_operations
    test_delivery
    test_additional
    
    # Resumo final
    print_header "RESUMO DOS TESTES"
    
    echo -e "Total de testes executados: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Testes passados: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Testes falhados: ${RED}$FAILED_TESTS${NC}"
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        local success_rate=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
        echo -e "Taxa de sucesso: ${BLUE}$success_rate%${NC}"
    fi
    
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 Todos os testes passaram com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Alguns testes falharam.${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}IDs criados durante os testes:${NC}"
    echo "  Categoria: $CATEGORY_ID"
    echo "  Produto: $PRODUCT_ID"
    echo "  Usuário Cliente: $USER_ID"
    echo "  Item do Carrinho: $CART_ITEM_ID"
    echo "  Pedido: $ORDER_ID"
    echo "  Pagamento: $PAYMENT_ID"
    echo "  Método de Pagamento: $PAYMENT_METHOD_ID"
    echo "  Avaliação: $REVIEW_ID"
    
    # Salvar resultados em arquivo
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local result_file="test_results_${timestamp}.txt"
    
    {
        echo "========================================"
        echo "RESULTADOS DOS TESTES - $(date)"
        echo "========================================"
        echo "Total de testes: $TOTAL_TESTS"
        echo "Testes passados: $PASSED_TESTS"
        echo "Testes falhados: $FAILED_TESTS"
        
        if [ $TOTAL_TESTS -gt 0 ]; then
            local success_rate=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
            echo "Taxa de sucesso: $success_rate%"
        fi
        
        echo ""
        echo "IDs criados:"
        echo "  Categoria: $CATEGORY_ID"
        echo "  Produto: $PRODUCT_ID"
        echo "  Usuário: $USER_ID"
        echo "  Pedido: $ORDER_ID"
        echo "  Pagamento: $PAYMENT_ID"
        echo "  Método de Pagamento: $PAYMENT_METHOD_ID"
        echo "  Avaliação: $REVIEW_ID"
    } > "$result_file"
    
    echo -e "\n${GREEN}📄 Resultados salvos em: $result_file${NC}"
}

# Executar função principal
main