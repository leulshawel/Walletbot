the bot and the web3 service are independent services 
the bot won't work without the web3 service

```sh
git clone https://github.com/leulshawel/Walletbot
```

open two terminal sessions

<h4>in bot session</h4>

```sh
cd ./Walletbot/bot
nom install
npm start
```

<h4>in the web3 service session</h4><br>

```sh
cd ./Walletbot/web3_service
```

    if you want to work with the main blockchain network

```sh
npm start
```
    if you have a local geth (or other) blockchain running
```sh
ENVIRONMENT=dev npm start
```