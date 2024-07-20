the bot and the web3 service are independent services<br>
the bot won't work without the web3 service running<br>
each service has a .env file for environment valiables



```sh
git clone https://github.com/leulshawel/Walletbot
```


```sh
cd ./Walletbot
```

Simplest way (requires docker and docker-compose)

```sh
docker-compose up -d
```


open two terminal sessions (in Wallet directory)

<h4>in bot session</h4>
add your botapi token in the .env file

```sh
cd ./bot
npm install
npm run build
npm start
```

<h4>in the web3 service session</h4><br>

```sh
cd ./web3_service
npm install
npm run build
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