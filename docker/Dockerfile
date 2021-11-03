FROM node:13

ENV TZ Europe/Berlin

WORKDIR /app

COPY ./.babelrc ./package.json ./yarn.lock /app/
COPY ./build /app/build/
COPY ./src /app/src/

RUN apt -y update && apt -y install postgresql-client && rm -rf /var/lib/apt/lists/*
RUN yarn install && yarn build
RUN npm install -g