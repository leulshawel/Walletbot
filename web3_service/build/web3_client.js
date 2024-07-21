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
exports.Web3client = void 0;
const web3_1 = require("web3");
const send_crypto_1 = __importDefault(require("send-crypto"));
const bitcore_lib_1 = require("bitcore-lib");
const ethereumjs_tx_1 = require("ethereumjs-tx");
class Web3client {
    static connect() {
        return __awaiter(this, arguments, void 0, function* (uri = '') {
            //Connet to Ethereum blockchain (Using web3)
            Web3client.con = new web3_1.Web3(uri);
            //Create Contract objects for the USDT and XRP Contracts
            Web3client.contracts.XRP = new Web3client.con.eth.Contract(Web3client.contract_data.XRP.abi, Web3client.contract_data.XRP.address);
            Web3client.contracts.USDT = new Web3client.con.eth.Contract(Web3client.contract_data.USDT.abi, Web3client.contract_data.USDT.address);
            //Check if the Ethereum connection is working
            const isListening = yield Web3client.con.eth.net.isListening();
            return isListening;
        });
    }
    static createAcc() {
        const eth = Web3client.con.eth.accounts.create();
        const key = new bitcore_lib_1.PrivateKey();
        const wif = key.toWIF(); //a string representation of BTC private public key pair 
        const btc_address = key.toAddress().toString();
        return { address: eth.address, key: eth.privateKey, wif: wif, btc_address: btc_address };
    }
    //TODO:
    static sendBitcoin(from_wif, to_wif, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = new bitcore_lib_1.PrivateKey(from_wif).toString();
            const key_buffer = Buffer.from(key, 'hex');
            const acc = new send_crypto_1.default(key_buffer);
            const to = new bitcore_lib_1.PrivateKey(to_wif).toAddress.toString();
            const res = yield acc.send(to, value, "BTC")
                .then((hash) => { return { status: true, hash: hash }; })
                .catch((err) => { return { status: false, reason: err.message }; });
            return res;
        });
    }
    static sendEther(from, to, value, key) {
        return __awaiter(this, void 0, void 0, function* () {
            key;
            const key_buffer = Buffer.from(key, 'hex');
            try {
                const nonce = Web3client.con.utils.toHex(yield Web3client.con.eth.getTransactionCount(from));
                const value_hex = Web3client.con.utils.toHex(Web3client.con.utils.toWei(value, 'ether'));
                var reason = '';
                const gas_limit = yield (Web3client.con.eth.estimateGas({
                    nonce: nonce,
                    from: from,
                    to: to,
                    value: value_hex
                })
                    .then((p) => p)
                    .catch((e) => {
                    reason = e.message;
                    return null;
                }));
                if (!gas_limit) {
                    return { status: false, reason: reason };
                }
                const txn_object = new ethereumjs_tx_1.Transaction({
                    nonce: nonce,
                    gasLimit: Web3client.con.utils.toHex(gas_limit),
                    gasPrice: Web3client.con.utils.toHex(yield Web3client.con.eth.getGasPrice()),
                    value: value_hex
                });
                const txn = new ethereumjs_tx_1.Transaction(txn_object);
                txn.sign(key_buffer);
                const serializedTxn = txn.serialize().toString('hex');
                const res = yield (Web3client.con.eth.sendSignedTransaction('0x' + serializedTxn)
                    .then((res_) => { return { status: true, hash: res_ }; })
                    .catch((e) => { return { status: false, reason: e.message }; }));
                return res;
            }
            catch (err) {
                return { status: false, reason: err.message };
            }
        });
    }
    static sendToken(token_name, from, to, value, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const key_buffer = Buffer.from(key, 'hex');
            switch (token_name) {
                case ('XRP'):
                    var contract = Web3client.contracts.XRP;
                    break;
                case ('USDT'):
                    var contract = Web3client.contracts.USDT;
                    break;
                default:
                    return { status: false, reason: 'Unknown token_name' };
            }
            try {
                const txn_data = contract.methods.transfer(to, value).encodeABI();
                const nonce = Web3client.con.utils.toHex(yield Web3client.con.eth.getTransactionCount(from));
                var reason = '';
                const gas_limit = yield (Web3client.con.eth.estimateGas({
                    nonce: nonce,
                    from: from,
                    to: to,
                    data: txn_data
                })
                    .then((p) => p)
                    .catch((e) => {
                    reason = e.reason;
                    return null;
                }));
                if (!gas_limit) {
                    return { status: false, reason: reason };
                }
                const txn_object = new ethereumjs_tx_1.Transaction({
                    nonce: nonce,
                    gasLimit: Web3client.con.utils.toHex(gas_limit),
                    gasPrice: Web3client.con.utils.toHex(yield Web3client.con.eth.getGasPrice()),
                    data: txn_data
                });
                const txn = new ethereumjs_tx_1.Transaction(txn_object);
                txn.sign(key_buffer);
                const serializedTxn = '0x' + txn.serialize().toString('hex');
                const res = yield (Web3client.con.eth.sendSignedTransaction(serializedTxn)
                    .then((res_) => res_)
                    .catch((e) => {
                    return { status: false, reason: e.reason };
                }));
                return res;
            }
            catch (err) {
                return { status: false, reason: err.message };
            }
        });
    }
    static ethBalance(addr) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (Web3client.con.eth.getBalance(addr)
                .then((res_) => { return { status: true, balance: res_.toString() }; })
                .catch((e) => { return { status: false, reason: e.message }; }));
            return res;
        });
    }
    static btcBalance(wif) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = (new bitcore_lib_1.PrivateKey(wif)).toString();
            const key_buffer = Buffer.from(key, 'hex');
            const acc = new send_crypto_1.default(key_buffer);
            const res = yield acc.getBalance("BTC")
                .then((bal) => { return { status: true, balance: bal.toString() }; })
                .catch((err) => { return { status: false, reason: err.message }; });
            return res;
        });
    }
    static tokenBalance(token_name, address) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (token_name) {
                case ('XRP'):
                    var contract = Web3client.contracts.XRP;
                    break;
                case ('USDT'):
                    var contract = Web3client.contracts.USDT;
                    break;
                default:
                    return { status: false, reason: 'Unknown token_name' };
            }
            const res = (yield contract.methods.balanceOf(address).call()
                .then((b) => { return { status: true, balance: b.toString() }; })
                .catch((e) => { return { status: false, reason: 'Contract call failed' }; }));
            return res;
        });
    }
}
exports.Web3client = Web3client;
Web3client.blockcypherApi = 'https://api.blockcypher.com/v1/btc/main';
Web3client.contract_data = {
    XRP: {
        address: '0x628F76eAB0C1298F7a24d337bBbF1ef8A1Ea6A24',
        abi: [{ "inputs": [{ "internalType": "string", "name": "initialName", "type": "string" }, { "internalType": "string", "name": "initialSymbol", "type": "string" }, { "internalType": "uint256", "name": "initSupply", "type": "uint256" }, { "internalType": "uint8", "name": "initialDecimals", "type": "uint8" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint8", "name": "precision", "type": "uint8" }], "name": "SetDecimals", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "string", "name": "name", "type": "string" }], "name": "SetName", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "string", "name": "symbol", "type": "string" }], "name": "SetSymbol", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint8", "name": "newDecimals", "type": "uint8" }], "name": "setDecimals", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "newName", "type": "string" }], "name": "setName", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "newSymbol", "type": "string" }], "name": "setSymbol", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]
    },
    USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        abi: [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_upgradedAddress", "type": "address" }], "name": "deprecate", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "deprecated", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_evilUser", "type": "address" }], "name": "addBlackList", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "upgradedAddress", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "balances", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "maximumFee", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "_totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_maker", "type": "address" }], "name": "getBlackListStatus", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }], "name": "allowed", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "getOwner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "newBasisPoints", "type": "uint256" }, { "name": "newMaxFee", "type": "uint256" }], "name": "setParams", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }], "name": "issue", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "amount", "type": "uint256" }], "name": "redeem", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "basisPointsRate", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "isBlackListed", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_clearedUser", "type": "address" }], "name": "removeBlackList", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "MAX_UINT", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_blackListedUser", "type": "address" }], "name": "destroyBlackFunds", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "name": "_initialSupply", "type": "uint256" }, { "name": "_name", "type": "string" }, { "name": "_symbol", "type": "string" }, { "name": "_decimals", "type": "uint256" }], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }], "name": "Issue", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }], "name": "Redeem", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "newAddress", "type": "address" }], "name": "Deprecate", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "feeBasisPoints", "type": "uint256" }, { "indexed": false, "name": "maxFee", "type": "uint256" }], "name": "Params", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "_blackListedUser", "type": "address" }, { "indexed": false, "name": "_balance", "type": "uint256" }], "name": "DestroyedBlackFunds", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "_user", "type": "address" }], "name": "AddedBlackList", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "_user", "type": "address" }], "name": "RemovedBlackList", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Pause", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Unpause", "type": "event" }]
    }
};
Web3client.contracts = {
    XRP: new web3_1.Contract([], ''),
    USDT: new web3_1.Contract([], '')
};
