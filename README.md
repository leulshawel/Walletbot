This is a Micro-Service Architecture Blockchain wallet telegram bot

**How it works**<br>
  The web3 and the bot are independent services. The bot requires atleast one instance of the web3 service up and running.
  All requests to the bot that require interaction with any of the supported blockchains will be forwarded to the web3 serive
  which will send the response after handling the requests.


**Tech stack**:
  Language: typeScript
  runtime: node
  web3-library: web3.js
  telegram bot library: telegraf.js

**Getting started**

```sh
git clone https://github.com/leulshawel/Walletbot
cd ./Walletbot
npm run build-bot
npm run build-web3
```

Simplest way (requires docker and docker-compose)

```sh
docker-compose up -d
```

if you wanna do it manually 
open two terminal sessions (in Wallet directory)

<h4>in bot session</h4>
add your botapi token in the .env file

```sh
cd ./bot
npm install
npm start
```

<h4>in the web3 service session</h4><br>

```sh
cd ./web3_service
npm install
```

if you want to work with the main blockchain network

```sh
npm start
```
if you have geth (or other) local blockchain net running

cahnge the DEV_NET uri in .env and run
```sh
ENVIRONMENT=dev npm start
```
