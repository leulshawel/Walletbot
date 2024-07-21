"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Wallet = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// const BotSchema = new mongoose.Schema({
//     id: {
//         type: Number,
//         requre: true,
//     },
//     users: {
//         type:  Number,
//         default: 0,
//     }
// })
const UserSchema = new mongoose_1.default.Schema({
    tg_id: {
        type: Number,
        require: true
    },
    wallet: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: 'wallet',
        require: true
    },
    refered_by: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        require: false,
        ref: 'user'
    },
    last_seen: {
        type: Number,
        require: true
    }
});
const WalletSchema = new mongoose_1.default.Schema({
    btc_address: {
        type: String,
        require: true
    },
    address: {
        type: String,
        require: true
    },
    key: {
        type: String,
        require: true
    },
    wif: {
        type: String,
        require: true
    }
});
// const Bot = mongoose.model<BotDoc, mongoose.Model<BotDoc>>('bot', BotSchema)
const User = mongoose_1.default.model('user', UserSchema);
exports.User = User;
const Wallet = mongoose_1.default.model('wallet', WalletSchema);
exports.Wallet = Wallet;
