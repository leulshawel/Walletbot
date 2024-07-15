the bot and the web3 service are independent services 
the bot won't work without the web3 service

```sh
git clone https://github.com/leulshawel/Walletbot
```


```sh
cd ./Walletbot
```

open another terminal session (in the same dir)

<h4>in bot session</h4>

```sh
cd ./bot
npm install
npm start
```

<h4>in the web3 service session</h4><br>

```sh
cd ./web3_service
```

if you want to work with the main blockchain network

```sh
npm start
```
if you have geth (or other) local blockchain net running

```sh
ENVIRONMENT=dev npm start
```