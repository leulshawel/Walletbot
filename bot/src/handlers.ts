import { WalletDoc , User, Wallet} from "./model"
import { Context } from "telegraf"
import { Types } from "mongoose"
import { configDotenv } from 'dotenv'
import axios from "axios"


configDotenv()

export const WEB3_URI = process.env.WEB3_CLIENT_URI
const commandRegex = /^bot\s+.*\s+\d+(\.\d+)?\s?.*?$/ //^bot\s+.*\s+\d+(\.\d+)?/  // Regex for in group command [cosmosbot command amount]


interface ContextWithSession extends Context{
    session: { 
        [x: string]: string;
    }
}


async  function get_user_wallet (tg_id: number | undefined): Promise<WalletDoc | undefined> {
    if (tg_id == undefined) { return undefined }
    const user = await User.findOne({tg_id: tg_id})
    await user?.populate('wallet')
    return user?.wallet
}

async function handle_airdrop(from: String, recievers: String[], amount: string, token_name: string){
    let endpoint: string;

    switch(token_name){
        case('ETH'):
            endpoint = '/send/eth'
            break
        case('BTC'):
            endpoint = '/send/btc'
            break
        case('USDT'):
            endpoint = '/send/usdt'
            break
        case('XRP'):
            endpoint = '/send/xrp'
            break
        default:
            return {status: false, reason: 'unkown tokwn name'}

    }
    try{
        recievers.forEach(async (elem, idx)=>{
            const _res = (await axios.post(WEB3_URI + endpoint, {
                from: from,
                to: elem,
                amount
            })).data;

            if (!_res.status){
                throw new Error(`Airdrop stopped at ${idx+1}/${recievers.length} due to ${_res.reason}`)
            }

        })
    }catch(err: any){
        return {status: false, reason: err.message}
    }

    return {status: true, reciever_count: recievers.length}

}


async function private_text_handler(ctx: ContextWithSession, next: CallableFunction) {
    if (ctx.session?.s_name == undefined)
        next()
    else if (ctx.session.s_name == 'BUY')
        ctx.reply(`Enter the amount of ${ctx.session.token_name} you wanna buy`)
    else if (ctx.session.s_name == 'SELL')
        ctx.reply(`Enter the amount of ${ctx.session.token_name} you wanna sell`)
    else if (ctx.session.s_name == 'transfer'){
        if (ctx.session.s_step == 'id'){
            const id = (ctx.message as any)?.text
            if (!Types.ObjectId.isValid(id)) { 
                ctx.reply(`<code>${id}</code> is not a valid wallet id. Retry with a valid id`, { parse_mode: 'HTML'})
                return
             }
            const wallet: WalletDoc | null  =  await Wallet.findById(id)
            if (!wallet) { 
                ctx.reply(`User <code>${id}</code> does't exist.`,{ parse_mode: 'HTML'})
                return
            }
            ctx.reply('Enter the amount:')
            ctx.session.s_step = 'amount'
            ctx.session.eth = wallet.address as string
            ctx.session.wif = wallet.wif as string
            ctx.session.key = wallet.key as string
        }else if (ctx.session.s_step == 'amount'){
            ctx.reply('Choose token to transfer', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'BTC', callback_data: 'BTC'}, {text: 'ETH', callback_data: 'ETH', }, {text: 'USTD', callback_data: 'USDT'}, {text: 'XRP', callback_data: 'XRP'}],
                        [{text: 'Cancel', callback_data: 'CNCL'}]
                    ]
                }
            })
            ctx.session.s_step = 'token'
            ctx.session.amount = (ctx.message as any).text
        } else if (ctx.session.s_step == 'token'){

        }

    }
}

async function group_text_handler(ctx: ContextWithSession, next: CallableFunction) {
    const reply_to = (ctx.message as any).reply_to_message
    const command = (ctx.message as any).text
    if (reply_to == undefined) { 
        ctx.reply('In group commands can only be replays to messages')
        return 
    }

    if (commandRegex.test(command)){
        const [c, cmd, amount, token, top] = (command as string).split(' ')
        const to_user_wallet = await get_user_wallet(reply_to.from.id)
        const from_user_wallet = await get_user_wallet(ctx.from?.id) as WalletDoc
        let reciever_addresses: String[] = []

        if(to_user_wallet == undefined ){ return }

        let res: any;
        ctx.sendChatAction('typing')
        switch(cmd){
            case('tip'):
                if (token == undefined || token == 'ETH'){
                    res = (await axios.post(`${WEB3_URI}/send/eth`, {
                        from: from_user_wallet.address,
                        to: to_user_wallet.address,
                        value: amount,
                        key: from_user_wallet.key.slice(2)
                    })).data
                }else if (token == 'BTC'){
                    res = (await axios.post(`${WEB3_URI}/send/btc`, {
                        from_wif: from_user_wallet.wif,
                        to_wif: to_user_wallet.wif,
                        value: amount,
                    })).data
                }
                else{
                    res = (await axios.post(`${WEB3_URI}/send/token`, {
                        token_name: token,
                        from: from_user_wallet.address,
                        to: to_user_wallet.address,
                        value: amount,
                        key: from_user_wallet.key.slice(2)
                    })).data
                }
                break
            case('airdrop'):
                if(top == undefined){
                    ctx.reply('Improper command use\nEg: <code>bot airdrop 1 usdt 25</code>\nThe above command will send 1 usdt each to the 25 last active members', {
                        parse_mode: 'HTML'
                    })
                    return
                }
                const from = await get_user_wallet(ctx.from?.id);
                const recievers = await User.find().sort({last_active: -1}).limit(parseInt(top))
                reciever_addresses = []
                recievers.forEach(async (e)=>{
                    await e.populate('wallet')
                    reciever_addresses.push(e.wallet.address)
                })        
                res = await handle_airdrop(from?.address as String, reciever_addresses, amount, token)
                break
            default:
                res = {status: false, reason: 'Unknown Command name'}
                break
        }

        if (res.status) {
            ctx.reply(`${ctx.from?.username} ${cmd}ed ${amount + ' ' + (!token ? 'ether' : token)} for ${cmd == 'tip' ? to_user_wallet.address : '\n' + reciever_addresses}`, {
                reply_parameters: {
                    message_id: ctx.message?.message_id as number
                }
            })
        }else{
            ctx.reply(`Error: ${res.reason}`, {
                reply_parameters: {
                message_id: ctx.message?.message_id as number
            }
        })
    }
}}


export { 
    get_user_wallet, 
    private_text_handler, 
    group_text_handler,
    ContextWithSession
}

