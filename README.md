# chatgpt nodejs服务
本项目集成了GPT3.5、GPT4、GPT联网、必应、Claude、百度文心一言等模型

Demo项目地址 [若愚AI小助手](https://ai.jsunc.com/invite?code=SC0266D0E73C)

![image](https://github.com/xingxin666/chatgpt-nodejs-web/assets/29698324/84dd695a-5867-4c32-835e-61a2a0ab061b)

![image](https://github.com/xingxin666/chatgpt-nodejs-web/assets/29698324/6d78e12b-e709-4d66-ae14-8240791cf7c5)

![image](https://github.com/xingxin666/chatgpt-nodejs-web/assets/29698324/68220fa3-727d-42da-b167-3a92455b3b96)

![image](https://github.com/xingxin666/chatgpt-nodejs-web/assets/29698324/cf219e76-c11e-47cb-9647-9cc0e62d5454)


## 前置要求

### Node
`node` 需要 `^18 版本

```shell
node -v
```

### PNPM
如果没有安装过 `pnpm`
```shell
npm install pnpm -g
```

## 开发
获取openai官方api key，修改.env的相关参数，如 OPENAI_API_KEY

本地开发访问openai需要搭梯子,修改.env的相关参数，如 HTTPS_PROXY=http://127.0.0.1:7890

进入本项目文件夹执行下面命令

```shell
pnpm install
```

```shell
pnpm start
```

### 访问
post 请求

http://localhost:3008/api/chat-process

参数例子
Headers：Content-Type application/json

Body：{"prompt":"介绍下你自己","modelCode": "ERNIE-Bot-turbo"}

curl -X POST -H "Content-Type: application/json" -d '{"prompt": "你是谁","modelCode": "GPT-3.5"}' http://localhost:3008/api/chat-process

## 生产部署
复制整个项目文件夹到有 `node` 服务环境的服务器上。

执行本文件夹的 sh start.sh

![image](https://github.com/xingxin666/chatgpt-nodejs-web/assets/29698324/08ca67f6-20ac-43a6-a87f-8bf1b331f323)
