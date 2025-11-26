# Base Node com Alpine (leve)
FROM node:20-alpine

# Diretório do projeto
WORKDIR /usr/src/app

# Copia apenas package.json e tsconfig.json para cache do Docker
COPY package*.json tsconfig.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Compila TypeScript para dist/
RUN npm run build

# Porta que a API irá escutar
EXPOSE 3000

# Comando para rodar a API
CMD ["npm", "start"]
