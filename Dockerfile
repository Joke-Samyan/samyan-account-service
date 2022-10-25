FROM node:latest

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

# Install some depenendencies
COPY package.json .

RUN yarn install

COPY . .

EXPOSE 8080

CMD ["yarn", "start"]