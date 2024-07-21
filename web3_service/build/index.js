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
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const web3_client_1 = require("./web3_client");
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const env = process.env.ENVIRONMENT;
let API = '';
let net_uri = '';
if (env == 'dev') {
    net_uri = process.env.DEV_NET || '';
}
else {
    net_uri = process.env.MAIN_NET || '';
    API = process.env.API || '';
}
const PORT = parseInt(process.env.PORT || '');
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield web3_client_1.Web3client.connect(net_uri + API))) {
            throw new Error("Web3 client couldn't connect to network");
        }
        console.log('Connected to Network');
        app_1.app.listen(PORT, () => {
            console.log(`Web3 service listening on ${PORT}`);
        });
    });
}
start().catch((e) => {
    console.log(e.message);
    process.exit(1);
});
console.log(`trying to connect to ${net_uri}`);
