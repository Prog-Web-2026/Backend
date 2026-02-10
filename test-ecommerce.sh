#!/bin/bash

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

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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

print_request() {
    echo -e "${CYAN}📤 REQUEST:${NC}"
    echo -e "   ${MAGENTA}Method:${NC} $1"
    echo -e "   ${MAGENTA}URL:${NC} $2"
    if [ ! -z "$3" ]; then
        echo -e "   ${MAGENTA}Body:${NC}"
        echo "$3" | jq . 2>/dev/null || echo "   $3"
    fi
    if [ ! -z "$4" ]; then
        echo -e "   ${MAGENTA}Auth:${NC} Bearer ${4:0:20}..."
    fi
}

print_response() {
    echo -e "${CYAN}📥 RESPONSE (HTTP $1):${NC}"
    if [ ! -z "$2" ]; then
        echo "$2" | jq . 2>/dev/null || echo "$2" | head -c 500
    fi
    echo ""
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local token="$5"

    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 $name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    print_request "$method" "$BASE_URL$endpoint" "$data" "$token"

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
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    if [[ $http_code =~ ^2[0-9][0-9]$ ]]; then
        print_success "$name (HTTP $http_code)"
        echo "$body"
        return 0
    else
        print_error "$name (HTTP $http_code)"
        return 1
    fi
}

extract_id() {
    echo "$1" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

extract_token() {
    echo "$1" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

extract_cart_item_id() {
    echo "$1" | grep -o '"cartItem":{[^}]*"id":[0-9]*' | grep -o '"id":[0-9]*' | cut -d':' -f2
}

extract_order_id() {
    echo "$1" | grep -o '"order":{[^}]*"id":[0-9]*' | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

extract_payment_id() {
    echo "$1" | grep -o '"payment":{[^}]*"id":[0-9]*' | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2
}

wait_for_input() {
    echo ""
    read -p "Pressione Enter para continuar..."
}

# =========================================
# 1. TESTES DE AUTENTICAÇÃO
# =========================================
test_auth() {
    print_header "1. TESTES DE AUTENTICAÇÃO"

    # Login como admin
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 Login Admin${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local login_data="{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
    print_request "POST" "$BASE_URL/auth/login" "$login_data" ""

    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    ADMIN_TOKEN=$(extract_token "$body")

    if [ -n "$ADMIN_TOKEN" ]; then
        print_success "Login admin realizado com sucesso"
    else
        print_error "Falha no login admin"
        exit 1
    fi

    # Verificar token
    test_endpoint "POST /auth/verify - Verificar Token" "POST" "/auth/verify" "" "$ADMIN_TOKEN"

    # Verificar autenticação
    test_endpoint "GET /auth/check - Verificar Autenticação" "GET" "/auth/check" "" "$ADMIN_TOKEN"

    # Verificar role
    test_endpoint "GET /auth/role - Verificar Role" "GET" "/auth/role" "" "$ADMIN_TOKEN"

    # Buscar usuário atual
    test_endpoint "GET /auth/me - Buscar Usuário Atual" "GET" "/auth/me" "" "$ADMIN_TOKEN"

    # Refresh token
    test_endpoint "POST /auth/refresh - Refresh Token" "POST" "/auth/refresh" "" "$ADMIN_TOKEN"

    wait_for_input
}

# =========================================
# 2. TESTES DE USUÁRIO (ADMIN)
# =========================================
test_users_admin() {
    print_header "2. TESTES DE USUÁRIO (ADMIN)"

    # Listar todos os usuários
    test_endpoint "GET /users - Listar Todos Usuários (Admin)" "GET" "/users" "" "$ADMIN_TOKEN"

    # Listar com filtro de role
    test_endpoint "GET /users?role=customer - Filtrar por Role" "GET" "/users?role=customer" "" "$ADMIN_TOKEN"

    # Listar com filtro de status
    test_endpoint "GET /users?isActive=true - Filtrar por Status" "GET" "/users?isActive=true" "" "$ADMIN_TOKEN"

    # Buscar usuário admin por ID
    USER_ID=1
    test_endpoint "GET /users/:id - Buscar Usuário por ID" "GET" "/users/$USER_ID" "" "$ADMIN_TOKEN"

    # Atualizar usuário admin
    test_endpoint "PUT /users/:id - Atualizar Usuário" "PUT" "/users/$USER_ID" \
        '{"name":"Admin Atualizado","phone":"11999990000"}' \
        "$ADMIN_TOKEN"

    wait_for_input
}

# =========================================
# 3. TESTES DE CATEGORIA
# =========================================
test_categories() {
    print_header "3. TESTES DE CATEGORIA"

    # Criar categoria
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /categories - Criar Categoria${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local category_data='{"name":"Eletrônicos de Teste","description":"Categoria para testes do sistema","isActive":true}'
    print_request "POST" "$BASE_URL/categories" "$category_data" "$ADMIN_TOKEN"

    response=$(curl -s -X POST "$BASE_URL/categories" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$category_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    CATEGORY_ID=$(extract_id "$body")

    if [ -n "$CATEGORY_ID" ]; then
        print_success "Categoria criada com ID: $CATEGORY_ID"
    else
        print_error "Falha ao criar categoria"
        CATEGORY_ID=1
    fi

    # Listar categorias
    test_endpoint "GET /categories - Listar Categorias" "GET" "/categories" "" ""

    # Buscar categoria por ID
    test_endpoint "GET /categories/:id - Buscar Categoria por ID" "GET" "/categories/$CATEGORY_ID" "" ""

    # Atualizar categoria
    test_endpoint "PUT /categories/:id - Atualizar Categoria" "PUT" "/categories/$CATEGORY_ID" \
        '{"name":"Eletrônicos Atualizados","description":"Descrição atualizada"}' \
        "$ADMIN_TOKEN"

    # Categorias populares
    test_endpoint "GET /categories/popular?limit=3 - Categorias Populares" "GET" "/categories/popular?limit=3" "" ""

    wait_for_input
}

# =========================================
# 4. TESTES DE PRODUTO
# =========================================
test_products() {
    print_header "4. TESTES DE PRODUTO"

    # Criar produto
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /products - Criar Produto${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local product_data="{\"name\":\"Smartphone Teste $RANDOM\",\"description\":\"Produto para testes do sistema\",\"price\":99.99,\"stock\":100,\"categoryId\":$CATEGORY_ID,\"isActive\":true}"
    print_request "POST" "$BASE_URL/products" "$product_data" "$ADMIN_TOKEN"

    response=$(curl -s -X POST "$BASE_URL/products" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$product_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    PRODUCT_ID=$(extract_id "$body")

    if [ -n "$PRODUCT_ID" ]; then
        print_success "Produto criado com ID: $PRODUCT_ID"
    else
        print_error "Falha ao criar produto"
        PRODUCT_ID=1
    fi

    # Listar produtos
    test_endpoint "GET /products - Listar Produtos" "GET" "/products" "" ""

    # Listar com paginação
    test_endpoint "GET /products?limit=5&offset=0 - Listar com Paginação" "GET" "/products?limit=5&offset=0" "" ""

    # Buscar produto por ID
    test_endpoint "GET /products/:id - Buscar Produto por ID" "GET" "/products/$PRODUCT_ID" "" ""

    # Buscar produto com reviews
    test_endpoint "GET /products/:id?includeReviews=true - Produto com Reviews" "GET" "/products/$PRODUCT_ID?includeReviews=true" "" ""

    # Atualizar produto
    test_endpoint "PUT /products/:id - Atualizar Produto" "PUT" "/products/$PRODUCT_ID" \
        '{"name":"Produto Atualizado","price":89.99,"description":"Descrição atualizada"}' \
        "$ADMIN_TOKEN"

    # Atualizar estoque
    test_endpoint "PATCH /products/:id/stock - Adicionar Estoque" "PATCH" "/products/$PRODUCT_ID/stock" \
        '{"quantity":50,"operation":"add"}' \
        "$ADMIN_TOKEN"

    # Buscar por categoria
    test_endpoint "GET /products?categoryId=X - Produtos por Categoria" "GET" "/products?categoryId=$CATEGORY_ID" "" ""

    # Buscar produtos
    test_endpoint "GET /products/search?q=teste - Buscar Produtos" "GET" "/products/search?q=teste" "" ""

    wait_for_input
}

# =========================================
# 5. REGISTRO E LOGIN DE CLIENTE
# =========================================
test_customer_auth() {
    print_header "5. REGISTRO E LOGIN DE CLIENTE"

    local timestamp=$(date +%s)
    local customer_email="cliente_${timestamp}@teste.com"

    # Registrar cliente
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /auth/register - Registrar Cliente${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local register_data="{\"name\":\"Cliente Teste\",\"email\":\"$customer_email\",\"password\":\"senha123\",\"phone\":\"11999999999\"}"
    print_request "POST" "$BASE_URL/auth/register" "$register_data" ""

    response=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    CUSTOMER_TOKEN=$(extract_token "$body")
    USER_ID=$(extract_id "$body")

    if [ -n "$CUSTOMER_TOKEN" ]; then
        print_success "Cliente registrado com sucesso - ID: $USER_ID"
    else
        print_error "Falha ao registrar cliente"
        USER_ID=2
    fi

    # Login do cliente
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /auth/login - Login Cliente${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local login_data="{\"email\":\"$customer_email\",\"password\":\"senha123\"}"
    print_request "POST" "$BASE_URL/auth/login" "$login_data" ""

    response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        -w '|%{http_code}')

    http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    CUSTOMER_TOKEN=$(extract_token "$body")

    if [ -n "$CUSTOMER_TOKEN" ]; then
        print_success "Login cliente realizado com sucesso"
    else
        print_error "Falha no login cliente"
    fi

    # Atualizar endereço do cliente
    test_endpoint "PUT /users/me/address - Atualizar Endereço" "PUT" "/users/me/address" \
        '{"street":"Av Paulista","number":"1000","neighborhood":"Bela Vista","city":"São Paulo","state":"SP","zipCode":"01310100"}' \
        "$CUSTOMER_TOKEN"

    wait_for_input
}

# =========================================
# 6. TESTES DE CARRINHO
# =========================================
test_cart() {
    print_header "6. TESTES DE CARRINHO"

    if [ -z "$PRODUCT_ID" ]; then
        print_error "Produto não disponível para teste do carrinho"
        return
    fi

    # Adicionar ao carrinho
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /cart - Adicionar ao Carrinho${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local cart_data="{\"productId\":$PRODUCT_ID,\"quantity\":2}"
    print_request "POST" "$BASE_URL/cart" "$cart_data" "$CUSTOMER_TOKEN"

    response=$(curl -s -X POST "$BASE_URL/cart" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "$cart_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    CART_ITEM_ID=$(extract_cart_item_id "$body")

    if [ -n "$CART_ITEM_ID" ]; then
        print_success "Item adicionado ao carrinho com ID: $CART_ITEM_ID"
    else
        print_error "Falha ao adicionar ao carrinho"
        return
    fi

    # Ver carrinho
    test_endpoint "GET /cart - Ver Carrinho" "GET" "/cart" "" "$CUSTOMER_TOKEN"

    # Calcular total
    test_endpoint "GET /cart/total - Calcular Total do Carrinho" "GET" "/cart/total" "" "$CUSTOMER_TOKEN"

    # Verificar disponibilidade
    test_endpoint "GET /cart/availability - Verificar Disponibilidade" "GET" "/cart/availability" "" "$CUSTOMER_TOKEN"

    # Atualizar item do carrinho
    test_endpoint "PUT /cart/:id - Atualizar Item do Carrinho" "PUT" "/cart/$CART_ITEM_ID" \
        '{"quantity":3}' \
        "$CUSTOMER_TOKEN"

    # Fazer checkout (selecionar itens)
    test_endpoint "POST /cart/checkout - Checkout do Carrinho" "POST" "/cart/checkout" \
        "{\"selectedCartItemIds\":[$CART_ITEM_ID]}" \
        "$CUSTOMER_TOKEN"

    wait_for_input
}

# =========================================
# 7. TESTES DE PEDIDO
# =========================================
test_orders() {
    print_header "7. TESTES DE PEDIDO"

    if [ -z "$CART_ITEM_ID" ]; then
        print_error "Não há itens no carrinho para criar pedido"
        return
    fi

    # Criar pedido
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /orders - Criar Pedido${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local order_data="{\"selectedCartItemIds\":[$CART_ITEM_ID],\"notes\":\"Pedido de teste do sistema\"}"
    print_request "POST" "$BASE_URL/orders" "$order_data" "$CUSTOMER_TOKEN"

    response=$(curl -s -X POST "$BASE_URL/orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "$order_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    ORDER_ID=$(extract_order_id "$body")

    if [ -n "$ORDER_ID" ]; then
        print_success "Pedido criado com ID: $ORDER_ID"
    else
        print_error "Falha ao criar pedido"
        ORDER_ID=1
    fi

    # Buscar pedido por ID
    test_endpoint "GET /orders/:id - Buscar Pedido por ID" "GET" "/orders/$ORDER_ID" "" "$CUSTOMER_TOKEN"

    # Listar pedidos do usuário
    test_endpoint "GET /orders/my-orders - Listar Meus Pedidos" "GET" "/orders/my-orders" "" "$CUSTOMER_TOKEN"

    # Listar com filtro de status
    test_endpoint "GET /orders/my-orders?status=pending - Pedidos Pendentes" "GET" "/orders/my-orders?status=pending" "" "$CUSTOMER_TOKEN"

    # Estatísticas de pedidos (admin)
    test_endpoint "GET /orders/stats - Estatísticas de Pedidos (Admin)" "GET" "/orders/stats" "" "$ADMIN_TOKEN"

    # Listar todos os pedidos (admin)
    test_endpoint "GET /orders/all - Listar Todos Pedidos (Admin)" "GET" "/orders/all" "" "$ADMIN_TOKEN"

    wait_for_input
}

# =========================================
# 8. TESTES DE PAGAMENTO
# =========================================
test_payments() {
    print_header "8. TESTES DE PAGAMENTO"

    if [ -z "$ORDER_ID" ]; then
        print_error "Não há pedido para processar pagamento"
        return
    fi

    # Processar pagamento com cartão de crédito
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /orders/:id/payment - Processar Pagamento (Cartão de Crédito)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local payment_data='{"type":"credit_card"}'
    print_request "POST" "$BASE_URL/orders/$ORDER_ID/payment" "$payment_data" "$CUSTOMER_TOKEN"

    response=$(curl -s -X POST "$BASE_URL/orders/$ORDER_ID/payment" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "$payment_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    PAYMENT_ID=$(extract_payment_id "$body")

    if [ -n "$PAYMENT_ID" ]; then
        print_success "Pagamento processado com ID: $PAYMENT_ID"
    else
        print_error "Falha ao processar pagamento"
        PAYMENT_ID=1
    fi

    # Buscar pagamento por ID
    test_endpoint "GET /payments/:id - Buscar Pagamento por ID" "GET" "/payments/$PAYMENT_ID" "" "$CUSTOMER_TOKEN"

    # Buscar pagamento por pedido
    test_endpoint "GET /payments/order/:orderId - Buscar Pagamento por Pedido" "GET" "/payments/order/$ORDER_ID" "" "$CUSTOMER_TOKEN"

    # Listar pagamentos do usuário
    test_endpoint "GET /payments/my-payments - Listar Meus Pagamentos" "GET" "/payments/my-payments" "" "$CUSTOMER_TOKEN"

    wait_for_input
}

# =========================================
# 9. TESTES DE STATUS DO PEDIDO E ENTREGA
# =========================================
test_order_flow() {
    print_header "9. TESTES DE FLUXO DO PEDIDO"

    if [ -z "$ORDER_ID" ]; then
        print_error "Não há pedido para testar fluxo"
        return
    fi

    # Atualizar status para preparing (admin)
    test_endpoint "PATCH /orders/:id/status - Atualizar para Preparing" "PATCH" "/orders/$ORDER_ID/status" \
        '{"status":"preparing"}' \
        "$ADMIN_TOKEN"

    # Atualizar status para ready_for_pickup (admin)
    test_endpoint "PATCH /orders/:id/status - Atualizar para Ready for Pickup" "PATCH" "/orders/$ORDER_ID/status" \
        '{"status":"ready_for_pickup"}' \
        "$ADMIN_TOKEN"

    # Verificar pedido após atualizações
    test_endpoint "GET /orders/:id - Verificar Pedido Atualizado" "GET" "/orders/$ORDER_ID" "" "$CUSTOMER_TOKEN"

    wait_for_input
}

# =========================================
# 10. TESTES DE ENTREGADOR
# =========================================
test_delivery() {
    print_header "10. TESTES DE ENTREGADOR"

    local timestamp=$(date +%s)
    local delivery_email="entregador_${timestamp}@teste.com"

    # Registrar entregador
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /auth/delivery/register - Registrar Entregador${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local register_data="{\"name\":\"Entregador Teste\",\"email\":\"$delivery_email\",\"password\":\"senha123\",\"phone\":\"11977777777\"}"
    print_request "POST" "$BASE_URL/auth/delivery/register" "$register_data" ""

    response=$(curl -s -X POST "$BASE_URL/auth/delivery/register" \
        -H "Content-Type: application/json" \
        -d "$register_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    DELIVERY_TOKEN=$(extract_token "$body")

    if [ -n "$DELIVERY_TOKEN" ]; then
        print_success "Entregador registrado com sucesso"
    else
        print_error "Falha ao registrar entregador"
    fi

    # Login entregador
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /auth/delivery/login - Login Entregador${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local login_data="{\"email\":\"$delivery_email\",\"password\":\"senha123\"}"
    print_request "POST" "$BASE_URL/auth/delivery/login" "$login_data" ""

    response=$(curl -s -X POST "$BASE_URL/auth/delivery/login" \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        -w '|%{http_code}')

    http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    DELIVERY_TOKEN=$(extract_token "$body")

    if [ -n "$DELIVERY_TOKEN" ]; then
        print_success "Login entregador realizado com sucesso"
    else
        print_error "Falha no login entregador"
    fi

    # Verificar role do entregador
    test_endpoint "GET /auth/role - Verificar Role do Entregador" "GET" "/auth/role" "" "$DELIVERY_TOKEN"

    # Ver pedidos disponíveis para entrega
    test_endpoint "GET /orders/delivery/available - Pedidos Disponíveis para Entrega" "GET" "/orders/delivery/available" "" "$DELIVERY_TOKEN"

    if [ -n "$ORDER_ID" ]; then
        # Aceitar pedido para entrega
        test_endpoint "POST /orders/delivery/:id/accept - Aceitar Pedido para Entrega" "POST" "/orders/delivery/$ORDER_ID/accept" "" "$DELIVERY_TOKEN"

        # Ver minhas entregas
        test_endpoint "GET /orders/delivery/my-deliveries - Minhas Entregas" "GET" "/orders/delivery/my-deliveries" "" "$DELIVERY_TOKEN"

        # Marcar como entregue
        test_endpoint "PATCH /orders/delivery/:id/delivered - Marcar como Entregue" "PATCH" "/orders/delivery/$ORDER_ID/delivered" "" "$DELIVERY_TOKEN"
    fi

    wait_for_input
}

# =========================================
# 11. TESTES DE AVALIAÇÃO
# =========================================
test_reviews() {
    print_header "11. TESTES DE AVALIAÇÃO"

    if [ -z "$PRODUCT_ID" ]; then
        print_error "Não há produto para avaliar"
        return
    fi

    # Adicionar avaliação
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔹 POST /reviews/product/:id - Adicionar Avaliação${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local review_data='{"rating":5,"comment":"Excelente produto! Chegou rapidamente."}'
    print_request "POST" "$BASE_URL/reviews/product/$PRODUCT_ID" "$review_data" "$CUSTOMER_TOKEN"

    response=$(curl -s -X POST "$BASE_URL/reviews/product/$PRODUCT_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CUSTOMER_TOKEN" \
        -d "$review_data" \
        -w '|%{http_code}')

    local http_code=$(echo "$response" | awk -F'|' '{print $NF}')
    local body=$(echo "$response" | sed 's/|[0-9]*$//')

    print_response "$http_code" "$body"

    REVIEW_ID=$(extract_id "$body")

    if [ -n "$REVIEW_ID" ]; then
        print_success "Avaliação criada com ID: $REVIEW_ID"
    else
        print_error "Falha ao criar avaliação"
        REVIEW_ID=1
    fi

    # Listar avaliações do produto
    test_endpoint "GET /reviews/product/:id - Listar Avaliações do Produto" "GET" "/reviews/product/$PRODUCT_ID" "" "$CUSTOMER_TOKEN"

    # Estatísticas de avaliações
    test_endpoint "GET /reviews/product/:id/stats - Estatísticas de Avaliações" "GET" "/reviews/product/$PRODUCT_ID/stats" "" "$CUSTOMER_TOKEN"

    # Buscar avaliação por ID
    test_endpoint "GET /reviews/:id - Buscar Avaliação por ID" "GET" "/reviews/$REVIEW_ID" "" "$CUSTOMER_TOKEN"

    # Atualizar avaliação
    test_endpoint "PUT /reviews/:id - Atualizar Avaliação" "PUT" "/reviews/$REVIEW_ID" \
        '{"rating":4,"comment":"Muito bom, recomendo!"}' \
        "$CUSTOMER_TOKEN"

    wait_for_input
}

# =========================================
# 12. TESTES DE USUÁRIO (CLIENTE)
# =========================================
test_user_operations() {
    print_header "12. TESTES DE USUÁRIO (CLIENTE)"

    if [ -z "$USER_ID" ]; then
        print_error "Usuário não disponível"
        return
    fi

    # Buscar usuário por ID
    test_endpoint "GET /users/:id - Buscar Usuário por ID" "GET" "/users/$USER_ID" "" "$CUSTOMER_TOKEN"

    # Atualizar usuário
    test_endpoint "PUT /users/:id - Atualizar Usuário" "PUT" "/users/$USER_ID" \
        '{"name":"Cliente Atualizado","phone":"11988888888"}' \
        "$CUSTOMER_TOKEN"

    # Alterar senha
    test_endpoint "PUT /users/me/password - Alterar Senha" "PUT" "/users/me/password" \
        '{"currentPassword":"senha123","newPassword":"novaSenha123"}' \
        "$CUSTOMER_TOKEN"

    # Reverter senha
    test_endpoint "PUT /users/me/password - Reverter Senha" "PUT" "/users/me/password" \
        '{"currentPassword":"novaSenha123","newPassword":"senha123"}' \
        "$CUSTOMER_TOKEN"

    # Alternar status do usuário (admin)
    test_endpoint "PATCH /users/:id/status - Desativar Usuário (Admin)" "PATCH" "/users/$USER_ID/status" \
        '{"isActive":false}' \
        "$ADMIN_TOKEN"

    test_endpoint "PATCH /users/:id/status - Reativar Usuário (Admin)" "PATCH" "/users/$USER_ID/status" \
        '{"isActive":true}' \
        "$ADMIN_TOKEN"

    wait_for_input
}

# =========================================
# 13. TESTES DE ESTORNO (ADMIN)
# =========================================
test_refund() {
    print_header "13. TESTES DE ESTORNO (ADMIN)"

    if [ -z "$PAYMENT_ID" ]; then
        print_error "Não há pagamento para estornar"
        return
    fi

    # Estornar pagamento
    test_endpoint "POST /payments/:id/refund - Estornar Pagamento (Admin)" "POST" "/payments/$PAYMENT_ID/refund" \
        '{"reason":"Teste de estorno"}' \
        "$ADMIN_TOKEN"

    # Verificar pagamento após estorno
    test_endpoint "GET /payments/:id - Verificar Pagamento Estornado" "GET" "/payments/$PAYMENT_ID" "" "$ADMIN_TOKEN"

    wait_for_input
}

# =========================================
# 14. TESTES ADICIONAIS - LIMPEZA
# =========================================
test_cleanup() {
    print_header "14. TESTES DE LIMPEZA"

    # Remover item do carrinho (se existir)
    if [ -n "$CART_ITEM_ID" ]; then
        test_endpoint "DELETE /cart/:id - Remover Item do Carrinho" "DELETE" "/cart/$CART_ITEM_ID" "" "$CUSTOMER_TOKEN"
    fi
    # Limpar carrinho
    test_endpoint "DELETE /cart - Limpar Carrinho" "DELETE" "/cart" "" "$CUSTOMER_TOKEN"


    # Excluir avaliação
    if [ -n "$REVIEW_ID" ] && [ "$REVIEW_ID" != "1" ]; then
        test_endpoint "DELETE /reviews/:id - Excluir Avaliação" "DELETE" "/reviews/$REVIEW_ID" "" "$CUSTOMER_TOKEN"
    fi

    # Excluir produto (admin)
    if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "1" ]; then
        test_endpoint "DELETE /products/:id - Excluir Produto (Admin)" "DELETE" "/products/$PRODUCT_ID" "" "$ADMIN_TOKEN"
    fi

    # Excluir categoria (admin)
    if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "1" ]; then
        test_endpoint "DELETE /categories/:id - Excluir Categoria (Admin)" "DELETE" "/categories/$CATEGORY_ID" "" "$ADMIN_TOKEN"
    fi

    wait_for_input
}

# =========================================
# FUNÇÃO PRINCIPAL
# =========================================
main() {
    clear

    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        🛒 E-COMMERCE API - TESTE COMPLETO DE ROTAS           ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}\n"

    echo -e "${YELLOW}Este script testará todas as rotas do sistema seguindo um fluxo completo:${NC}"
    echo ""
    echo "  1.  Autenticação (login, verify, check, role, me, refresh)"
    echo "  2.  Usuários Admin (listar, buscar, atualizar)"
    echo "  3.  Categorias (CRUD completo)"
    echo "  4.  Produtos (CRUD completo + estoque)"
    echo "  5.  Registro e Login de Cliente"
    echo "  6.  Carrinho (adicionar, ver, atualizar, checkout)"
    echo "  7.  Pedidos (criar, listar, buscar)"
    echo "  8.  Pagamentos (processar, listar)"
    echo "  9.  Fluxo do Pedido (status updates)"
    echo "  10. Entregador (registro, login, aceitar, entregar)"
    echo "  11. Avaliações (CRUD completo)"
    echo "  12. Operações de Usuário (atualizar, senha, status)"
    echo "  13. Estorno de Pagamento (admin)"
    echo "  14. Limpeza (exclusões)"
    echo ""
    echo -e "${YELLOW}Credenciais padrão:${NC}"
    echo -e "  Admin: ${CYAN}$ADMIN_EMAIL${NC} / ${CYAN}$ADMIN_PASSWORD${NC}"
    echo ""
    echo -e "${RED}⚠️  Certifique-se de que o servidor está rodando em $BASE_URL${NC}"
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
    test_order_flow
    test_delivery
    test_reviews
    test_user_operations
    test_refund
    test_cleanup

    # Resumo final
    print_header "📊 RESUMO DOS TESTES"

    echo ""
    echo -e "  Total de testes executados: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "  Testes passados:            ${GREEN}$PASSED_TESTS${NC}"
    echo -e "  Testes falhados:            ${RED}$FAILED_TESTS${NC}"

    if [ $TOTAL_TESTS -gt 0 ]; then
        local success_rate=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
        echo -e "  Taxa de sucesso:            ${BLUE}$success_rate%${NC}"
    fi

    echo ""

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 Todos os testes passaram com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Alguns testes falharam. Verifique os detalhes acima.${NC}"
    fi

    echo ""
    echo -e "${BLUE}📋 IDs criados durante os testes:${NC}"
    echo "  ├─ Categoria:    $CATEGORY_ID"
    echo "  ├─ Produto:      $PRODUCT_ID"
    echo "  ├─ Usuário:      $USER_ID"
    echo "  ├─ Item Carrinho:$CART_ITEM_ID"
    echo "  ├─ Pedido:       $ORDER_ID"
    echo "  ├─ Pagamento:    $PAYMENT_ID"
    echo "  └─ Avaliação:    $REVIEW_ID"

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
        echo "  Avaliação: $REVIEW_ID"
    } > "$result_file"

    echo -e "\n${GREEN}📄 Resultados salvos em: $result_file${NC}"
}

# Executar função principal
main
