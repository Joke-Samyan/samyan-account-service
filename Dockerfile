FROM node:19-alpine

WORKDIR /app

COPY package*.json ./

COPY tsconfig.json ./

RUN yarn install

COPY . .

RUN yarn build

# EXPOSE 8080

# CMD ["yarn", "start"]


FROM node:19-alpine

ENV NODE_ENV=production

ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app

COPY .env .env

COPY package*.json ./

RUN yarn install

COPY --from=0 /app/build ./build

EXPOSE 8080

CMD ["yarn", "start:prod"]