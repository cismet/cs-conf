FROM ubuntu:20.04

ENV TZ Europe/Berlin
ENV DEBIAN_FRONTEND noninteractive

WORKDIR /app

RUN apt -y update && apt -y install curl dumb-init git postgresql-client

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - \
 && apt -y install nodejs 
 
RUN curl -Ls --output /usr/local/bin/gitlab-runner "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64" \
 && chmod +x /usr/local/bin/gitlab-runner \
 && useradd --comment 'GitLab Runner' --create-home gitlab-runner --shell /bin/bash \ 
 && gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner \
 && rm /home/gitlab-runner/.bash_logout

RUN rm -rf /var/lib/apt/lists/*

COPY ./.babelrc ./package.json ./package-lock.json /app/
RUN npm install -g @babel/node
RUN npm install @babel/cli @babel/preset-env --save-dev

COPY ./src /app/src/
COPY ./test /app/test/
RUN npm run test
RUN npm run build
RUN npm install -g