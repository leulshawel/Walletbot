import mongoose, { mongo } from 'mongoose'
import { Types } from 'telegraf';

interface BotAttrs{
    Users: Number,
}

interface UserAtts{
    tg_id: Number;
    wallet: WalletDoc;
    refered_by: UserDoc;
}


interface WalletAttrs{
    address: String;
    key: String;
    wif: String;
    btc_address: string;
}

// interface BotDoc extends BotAttrs, mongoose.Document{}
export interface UserDoc extends UserAtts, mongoose.Document{}
export interface WalletDoc extends WalletAttrs, mongoose.Document{}




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

const UserSchema = new mongoose.Schema({
    tg_id:{
        type: Number,
        require: true
    },
    wallet: {
            type: mongoose.Schema.ObjectId,
            ref: 'wallet',
            require: true
    },
    refered_by: {
        type: mongoose.Schema.Types.ObjectId,
        require: false,
        ref: 'user'
    }
})


const WalletSchema = new mongoose.Schema({
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

})



// const Bot = mongoose.model<BotDoc, mongoose.Model<BotDoc>>('bot', BotSchema)
const User = mongoose.model<UserDoc, mongoose.Model<UserDoc>>('user', UserSchema)
const Wallet = mongoose.model<WalletDoc, mongoose.Model<UserDoc>>('wallet', WalletSchema)


export { Wallet, User }