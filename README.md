# Home depot system

### Dependencies
* python v2.x or python v3.5, v3.6, v3.7, v3.8
* make
* C/C++ compiler toolchain
* OpenSSL

### Development Environment
* NodeJS
* MongoDB

### Need env value
* **EMAIL_USER** 发送邮件的邮箱用户名
* **EMAIL_PASS** 发送邮件的邮箱验证码
* **MONGODB_CONNURL** **mongodb**的连接地址
* **MONGODB_TESTCONNURL** **mongodb**测试用的连接地址
* **TOP_SECRET** **jsonWebToken**的私钥
* **AMQP_SERVER** **rabbitmq**的连接地址

### Install via npm
```
    npm install
```

### Run server
#### production
```
    npm run start
```
#### development
```
    npm run wrap
```

### Find problems or synatx
```
    npm run lint
```

### Test
```
    npm run test
```
#### test coverage
```
    npm run cov
```
