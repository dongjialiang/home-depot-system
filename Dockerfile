# 加载镜像
FROM alpine:latest
ENV NODE_ENV production
# 创建工作目录
WORKDIR /usr/src/home-depot-system
# 复制项目文件
COPY package.json ./
# 修改alpine软件仓库的镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
# 修改hosts文件防止dns污染
RUN echo '199.232.68.133 raw.githubusercontent.com' >> /etc/hosts
# 更新源
RUN apk update && apk upgrade --available && sync
# 安装编译依赖和部署依赖
RUN apk --no-cache add --virtual builds-deps gcc nodejs npm
# 安装pnpm
# RUN npm i pnpm -g --registry=https://registry.npm.taobao.org
# 安装npm生产包依赖
RUN npm install -S --registry=https://registry.npm.taobao.org
# 删除编译依赖
RUN apk del builds-deps
# 删除临时文件
RUN rm /tmp/* -rf \
  && rm /root/.npm/ -rf \
  && rm /var/cache/apk/* -rf
# 从主机复制源文件到容器内
COPY . .
# 指定app运行的端口
EXPOSE 7326
# 启动镜像时运行服务器
CMD ["pnpm", "cluster"]
