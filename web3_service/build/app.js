"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const web3_client_1 = require("./web3_client");
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
app.get('/api', (req, res) => {
    res.status(200).send({ status: 'OK' });
});
app.get('/api/create', (req, res) => {
    const { address, key, wif, btc_address } = web3_client_1.Web3client.createAcc();
    console.log(address, key, wif, btc_address)
    res.status(200).send({
        address: address,
        key: key,
        wif: wif,
        btc_address: btc_address
    });
});
app.get('/api/balance/eth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address } = req.query;
    web3_client_1.Web3client.ethBalance(address).then((response) => {
        res.status(200).send(response);
    });
}));
app.get('/api/balance/btc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { wif } = req.query;
    const result = yield web3_client_1.Web3client.btcBalance(wif);
    res.status(200).send(result);
}));
app.get('/api/balance/token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token_name, address } = req.query;
    const result = yield web3_client_1.Web3client.tokenBalance(token_name, address);
    res.status(200).send(result);
}));
app.post('/api/send/eth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to, value, key } = req.body;
    const result = yield web3_client_1.Web3client.sendEther(from, to, value, key);
    res.status(200).send(result);
}));
app.post('/api/send/token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token_name, from, to, value, key } = req.body;
    const result = yield web3_client_1.Web3client.sendToken(token_name, from, to, value, key);
    res.status(200).send(result);
}));
app.post('/api/send/btc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from_wif, to_wif, value } = req.body;
    const result = yield web3_client_1.Web3client.sendBitcoin(from_wif, to_wif, value);
    res.status(200).send(result);
}));
