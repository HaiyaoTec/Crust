FROM node:14-alpine

WORKDIR /usr/src/app

COPY src ./src
COPY template ./template
COPY package.json ./
COPY tsconfig.json ./

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' >/etc/timezone \
    && npm set registry https://registry.npm.taobao.org/ \
    && npm install

EXPOSE 80

ENTRYPOINT npm run run