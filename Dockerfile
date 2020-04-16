# 加载镜像
FROM node:12-alpine
ENV NODE_ENV production
# 创建工作目录
WORKDIR /usr/src/home-depot-system
# 复制项目文件
COPY package*.json ./
# 修改alpine软件仓库的镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
# 安装编译依赖
RUN apk --no-cache add --virtual builds-deps \
    build-base python
# 安装npm依赖
RUN npm install -g node-pre-gyp --registry=https://registry.npm.taobao.org
RUN npm install --registry=https://registry.npm.taobao.org
# 删除编译依赖
RUN apk del builds-deps
# 从主机复制源文件到容器内
COPY . .
# 指定app运行的端口
EXPOSE 7326
# 启动镜像时运行服务器
CMD node server.js