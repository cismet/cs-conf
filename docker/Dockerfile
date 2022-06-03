FROM node:13

ENV TZ Europe/Berlin

WORKDIR /app

RUN apt -y update && apt -y install postgresql-client && rm -rf /var/lib/apt/lists/*
RUN npm install -g @babel/core @babel/node

COPY ./.babelrc ./package.json ./package-lock.json /app/
RUN npm install

COPY ./src /app/src/
RUN npm run build