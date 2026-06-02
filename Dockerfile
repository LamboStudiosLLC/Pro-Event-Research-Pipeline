FROM node:22

WORKDIR /app

COPY package*.json ./
COPY shims/ ./shims/
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
