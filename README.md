# Home depot system

## 描述
这是一个家具百货系统的后台接口例子, 仅用于学习

## 编译依赖
* make, gcc, g++
* OpenSSL

## 开发工具
* NodeJS

## 运行环境
* docker (不是必要的, 可以选择自己的MongoDB, redis, RabbitMQ)
* docker-compose (同上, 非必要)

## 安装npm包
```
    npm install
```
也可以使用yarn或者pnpm安装

## 配置环境变量
根据 **./config/.env.example** 文件在 **config** 文件夹创建一个 **.env** 文件

## 启动运行环境的软件
如果是使用docker和docker-compose, 可以参考 **deploy** 文件夹里的文件, 在windows环境开发建议更改后缀

以下文件里的docker-compose-test.yml采用MongoDB集群和redis集群, 单机模式的可用docker-compose-standalone.yml进行替换, 目前这两个文件里的服务都没有采用用户验证的形式，并不安全，请在非生产的环境进行测试

* docker-start.sh 构筑并启动容器, 使容器在后台运行
* docker-stop.sh 关闭并删除容器

以下部分的文件是以docker和docker-compose为基础执行的配置, 如果使用其他方式也可以作为一种参考
* shard-config.sh 配置MongoDB分片的分片节点和config服务器节点
* shard-route.sh 为MongoDB分片的mongos添加分片
* shard-enable.sh 为MongoDB中的数据库和集合启动分片(请参考文件修改自己的数据库名和集合名, 还有分片的形式)
* redis-cluster.sh 配置redis分片集群(请参考文件修改集群中每个redis的地址, 该地址可以是宿主机的地址)

## 运行服务
### 生产模式
```
    npm run start
```
### 开发模式
```
    npm run dev
```
### 用pm2运行集群服务
```
    npm run cluster
```

## 找问题和语法错误
```
    npm run lint
```

## 测试
#### 部分用户接口和用户模型的单元测试
测试前请先关闭服务
```
    npm run test
```

#### 测试所有的接口
在vscode上安装扩展REST Client, 打开 **tests/test.http** 文件, 点击相应的请求即可向接口发送请求

## 待做
 - [ ] 收藏功能
 - [ ] 分享商品搭配
 - [ ] 商品评价
