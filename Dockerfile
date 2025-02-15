FROM node:16

WORKDIR /interface-api

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start", "dev"]
