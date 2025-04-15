# frontend/Dockerfile
FROM node:16

WORKDIR /frontend

COPY frontend ./
RUN npm install

COPY .env .env

EXPOSE ${FRONTEND_PORT}

CMD ["npm", "start"]

