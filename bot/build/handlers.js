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
exports.WEB3_URI = void 0;
exports.get_user_wallet = get_user_wallet;
exports.private_text_handler = private_text_handler;
exports.group_text_handler = group_text_handler;
const model_1 = require("./model");
const mongoose_1 = require("mongoose");
const dotenv_1 = require("dotenv");
const axios_1 = __importDefault(require("axios"));
(0, dotenv_1.configDotenv)();
exports.WEB3_URI = process.env.WEB3_CLIENT_URI;
const commandRegex = /^bot\s+.*\s+\d+(\.\d+)?\s?.*?$/; //^bot\s+.*\s+\d+(\.\d+)?/  // Regex for in group command [cosmosbot command amount]
function get_user_wallet(tg_id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (tg_id == undefined) {
            return undefined;
        }
        const user = yield model_1.User.findOne({ tg_id: tg_id });
        yield (user === null || user === void 0 ? void 0 : user.populate('wallet'));
        return user === null || user === void 0 ? void 0 : user.wallet;
    });
}
function handle_airdrop(from, recievers, amount, token_name) {
    return __awaiter(this, void 0, void 0, function* () {
        let endpoint;
        switch (token_name) {
            case ('ETH'):
                endpoint = '/send/eth';
                break;
            case ('BTC'):
                endpoint = '/send/btc';
                break;
            case ('USDT'):
                endpoint = '/send/usdt';
                break;
            case ('XRP'):
                endpoint = '/send/xrp';
                break;
            default:
                return { status: false, reason: 'unkown tokwn name' };
        }
        try {
            recievers.forEach((elem, idx) => __awaiter(this, void 0, void 0, function* () {
                const _res = (yield axios_1.default.post(exports.WEB3_URI + endpoint, {
                    from: from,
                    to: elem,
                    amount
                })).data;
                if (!_res.status) {
                    throw new Error(`Airdrop stopped at ${idx + 1}/${recievers.length} due to ${_res.reason}`);
                }
            }));
        }
        catch (err) {
            return { status: false, reason: err.message };
        }
        return { status: true, reciever_count: recievers.length };
    });
}
function private_text_handler(ctx, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (((_a = ctx.session) === null || _a === void 0 ? void 0 : _a.s_name) == undefined)
            next();
        else if (ctx.session.s_name == 'BUY')
            ctx.reply(`Enter the amount of ${ctx.session.token_name} you wanna buy`);
        else if (ctx.session.s_name == 'SELL')
            ctx.reply(`Enter the amount of ${ctx.session.token_name} you wanna sell`);
        else if (ctx.session.s_name == 'transfer') {
            if (ctx.session.s_step == 'id') {
                const id = (_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text;
                if (!mongoose_1.Types.ObjectId.isValid(id)) {
                    ctx.reply(`<code>${id}</code> is not a valid wallet id. Retry with a valid id`, { parse_mode: 'HTML' });
                    return;
                }
                const wallet = yield model_1.Wallet.findById(id);
                if (!wallet) {
                    ctx.reply(`User <code>${id}</code> does't exist.`, { parse_mode: 'HTML' });
                    return;
                }
                ctx.reply('Enter the amount:');
                ctx.session.s_step = 'amount';
                ctx.session.eth = wallet.address;
                ctx.session.wif = wallet.wif;
                ctx.session.key = wallet.key;
            }
            else if (ctx.session.s_step == 'amount') {
                ctx.reply('Choose token to transfer', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'BTC', callback_data: 'BTC' }, { text: 'ETH', callback_data: 'ETH', }, { text: 'USTD', callback_data: 'USDT' }, { text: 'XRP', callback_data: 'XRP' }],
                            [{ text: 'Cancel', callback_data: 'CNCL' }]
                        ]
                    }
                });
                ctx.session.s_step = 'token';
                ctx.session.amount = ctx.message.text;
            }
            else if (ctx.session.s_step == 'token') {
            }
        }
    });
}
function group_text_handler(ctx, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const reply_to = ctx.message.reply_to_message;
        const command = ctx.message.text;
        if (reply_to == undefined) {
            ctx.reply('In group commands can only be replays to messages');
            return;
        }
        if (commandRegex.test(command)) {
            const [c, cmd, amount, token, top] = command.split(' ');
            const to_user_wallet = yield get_user_wallet(reply_to.from.id);
            const from_user_wallet = yield get_user_wallet((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id);
            let reciever_addresses = [];
            if (to_user_wallet == undefined) {
                return;
            }
            let res;
            ctx.sendChatAction('typing');
            switch (cmd) {
                case ('tip'):
                    if (token == undefined || token == 'ETH') {
                        res = (yield axios_1.default.post(`${exports.WEB3_URI}/send/eth`, {
                            from: from_user_wallet.address,
                            to: to_user_wallet.address,
                            value: amount,
                            key: from_user_wallet.key.slice(2)
                        })).data;
                    }
                    else if (token == 'BTC') {
                        res = (yield axios_1.default.post(`${exports.WEB3_URI}/send/btc`, {
                            from_wif: from_user_wallet.wif,
                            to_wif: to_user_wallet.wif,
                            value: amount,
                        })).data;
                    }
                    else {
                        res = (yield axios_1.default.post(`${exports.WEB3_URI}/send/token`, {
                            token_name: token,
                            from: from_user_wallet.address,
                            to: to_user_wallet.address,
                            value: amount,
                            key: from_user_wallet.key.slice(2)
                        })).data;
                    }
                    break;
                case ('airdrop'):
                    if (top == undefined) {
                        ctx.reply('Improper command use\nEg: <code>bot airdrop 1 usdt 25</code>\nThe above command will send 1 usdt each to the 25 last active members', {
                            parse_mode: 'HTML'
                        });
                        return;
                    }
                    const from = yield get_user_wallet((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id);
                    const recievers = yield model_1.User.find().sort({ last_active: -1 }).limit(parseInt(top));
                    reciever_addresses = [];
                    recievers.forEach((e) => __awaiter(this, void 0, void 0, function* () {
                        yield e.populate('wallet');
                        reciever_addresses.push(e.wallet.address);
                    }));
                    res = yield handle_airdrop(from === null || from === void 0 ? void 0 : from.address, reciever_addresses, amount, token);
                    break;
                default:
                    res = { status: false, reason: 'Unknown Command name' };
                    break;
            }
            if (res.status) {
                ctx.reply(`${(_c = ctx.from) === null || _c === void 0 ? void 0 : _c.username} ${cmd}ed ${amount + ' ' + (!token ? 'ether' : token)} for ${cmd == 'tip' ? to_user_wallet.address : '\n' + reciever_addresses}`, {
                    reply_parameters: {
                        message_id: (_d = ctx.message) === null || _d === void 0 ? void 0 : _d.message_id
                    }
                });
            }
            else {
                ctx.reply(`Error: ${res.reason}`, {
                    reply_parameters: {
                        message_id: (_e = ctx.message) === null || _e === void 0 ? void 0 : _e.message_id
                    }
                });
            }
        }
    });
}
