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
const mongoose_1 = __importDefault(require("mongoose"));
// import { MongoMemoryServer } from 'mongodb-memory-server'
const bot_1 = require("./bot");
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const MONGO_URI = process.env.MONGO_URI;
            // const mongo = await MongoMemoryServer.create();
            // const uri = mongo.getUri();
            // const M = MONGO_URI != undefined
            yield mongoose_1.default.connect(MONGO_URI);
            console.log('connected to db');
        }
        catch (err) {
            console.log(err);
        }
        bot_1.bot.catch((err, ctx) => {
            ctx.reply('An error occurred. Please try again later.');
            console.log(err);
            ctx.session = {};
        });
        bot_1.bot.launch();
        console.log('Bot up and running');
    });
}
start();
