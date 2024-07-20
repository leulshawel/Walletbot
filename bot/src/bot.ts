import { Telegraf, session, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { Wallet, User, WalletDoc, UserDoc } from './model'
import axios from "axios"
import {
    private_text_handler,
    group_text_handler,
    get_user_wallet,
    ContextWithSession,
    WEB3_URI
} from "./handlers";



const TOKEN = process.env.TOKEN as string

if (TOKEN == '') {
    console.log('Bot token not provided')
    process.exit(1)
}



const bot = new Telegraf<ContextWithSession>(TOKEN)
bot.use(session())



bot.start(async (ctx) => {
    ctx.session = {}
    ctx.sendChatAction('typing')
    const user_count = await User.countDocuments()
    ctx.reply(`Welcome to Wallet Bot..

+Send and recieve crypto assets on Ethereum and Bitcoin bockchains

+Send and receive tips and airdrops in groups.

+Refer your friends & and receive 5% commission on all tips for life.

--> Send/Press <code>My Wallet</code> to create a wallet and get started

Total users: ${user_count}`, { parse_mode: 'HTML' })

    ctx.reply('👇👇👇', Markup.keyboard([
        ['My Wallet', 'Transfer', 'Buy&Sell'],
        ['Balance', 'Referals', 'Cancel']
    ]).resize().persistent()
    )

    if (ctx.payload != undefined) {
        ctx.session.referer = ctx.payload
    }
})



bot.on('my_chat_member', ctx => {
    ctx.sendChatAction('typing')
    const added_member = ctx.myChatMember

    if (added_member.new_chat_member.user.id == ctx.botInfo.id) {
        if (added_member.new_chat_member.status == "administrator") {
            ctx.reply('Wooooo I feel like am taking over\nNow you can tip and airdrop')
        }
        else {
            ctx.reply('Here at your command.\n<b>Lnoving the energy</b>', { parse_mode: "HTML"})
        }
    } else {
        ctx.reply(`Hello ${added_member.new_chat_member.user.username}, Welcome to our group\n tips and airdrops are comming`)
    }

})



bot.on(message('text'), async (ctx, next) => {
    ctx.sendChatAction('typing')
    if (!ctx.session || ctx.message.text == "Cancel") {
        ctx.session = {}
    }
    const user = await User.findOne({ tg_id: ctx.from.id })

    if (ctx.chat.type == 'supergroup' || ctx.chat.type == 'group') {
        if (!user) {
            try { await ctx.deleteMessage() } catch (e) { }
            ctx.reply(`Go to @${ctx.botInfo.username} and create a wallet first`);
            return
        }
        group_text_handler(ctx, next)
    } else {
        if (!user && ctx.message.text != 'My Wallet') {
            try { await ctx.deleteMessage() } catch (e) { }
            ctx.reply(`You don't have a wallet.\nPress <code>My Wallet</code> button and a new wallet will be created for you`,
                {
                    parse_mode: 'HTML'
                });

            return
        }
        private_text_handler(ctx, next)
    }

})


bot.hears('My Wallet', async (ctx) => {
    ctx.sendChatAction('typing')
    if (ctx.chat.type != 'private') { return }
    ctx.sendChatAction('typing')
    var wallet = await get_user_wallet(ctx.from.id)
    var new_wallet;
    let id: number;
    if (!wallet) {
        const res = (await axios.get(`${WEB3_URI}/create`)
            .catch((e) => { return { data: null } })
        )
        if (!res.data) {
            ctx.reply(`Wallet bot is having internal error\nPlease try later`);
            return
        }
        const referer_user = await User.findOne({ tg_id: ctx.session.referer })


        const { address, key, wif, btc_address } = res.data
        new_wallet = new Wallet({
            address: address,
            key: key,
            wif: wif,
            btc_address: btc_address,
            refered_by: referer_user?.id,
            last_seen: Date.now()
        })
        const user = new User({ tg_id: ctx.from.id, wallet: new_wallet, last_active: new Date() })

        await new_wallet.save()
        await user.save()
        id = new_wallet.id
    } else {
        id = wallet.id
    }

    //get the tokens in wallet
    wallet = (wallet || new_wallet) as WalletDoc

    const btc_promise = axios.get(`${WEB3_URI}/balance/btc?wif=${wallet.wif}`)
    const ether_promise = axios.get(`${WEB3_URI}/balance/eth?address=${wallet.address}`)
    const usdt_promise = axios.get(`${WEB3_URI}/balance/token?token_name=USDT&address=${wallet.address}&key=${wallet.key}`)
    const xrp_promise = axios.get(`${WEB3_URI}/balance/token?token_name=XRP&address=${wallet.address}&key=${wallet.key}`)

    const [btc_balance, ether_balance, usdt_balance, xrp_balance] = await Promise.all([btc_promise, ether_promise, usdt_promise, xrp_promise])


    ctx.reply(`<b>Wallet ID:</b> <code>${id}</code>

<b>Token balances:</b>
    BTC:      ${(btc_balance as any).data.balance || (btc_balance as any).data.reason} 
    ETH:      ${(ether_balance as any).data.balance || (ether_balance as any).data.reason} 
    USDT:   ${(usdt_balance as any).data.balance || (usdt_balance as any).data.reason} 
    XRP:      ${(xrp_balance as any).data.balance || (xrp_balance as any).data.reason}

Your Ethereum address: 
<code>${wallet.address.slice(2)}</code> 

Your bitcoin address: 
<code>${wallet.btc_address}</code>

Press on the addresses to copy them
People on this bot can transfer supported crypto assets for you using your wallet id
    `,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Withdraw', callback_data: 'WTHDRW' }, { text: 'Deposit', callback_data: 'DPST' }],
                    [{ text: 'Check All on Wallet App', web_app: { url: 'https://app-url.com' } }]
                ]
            }
        })

})


bot.hears('Balance', async (ctx, next) => {
    ctx.session.s_name = 'balance'
    ctx.reply(`Choose asset`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'BTC', callback_data: 'BTC' }, { text: 'ETH', callback_data: 'ETH', }, { text: 'USTD', callback_data: 'USDT' }, { text: 'XRP', callback_data: 'XRP' }],
                [{ text: 'Cancel', callback_data: 'CNCL' }],
            ]
        }
    })
})



bot.hears('Transfer', async (ctx) => {
    ctx.reply(`Enter the wallet id of the reciever: `)
    ctx.session.s_name = 'transfer'
    ctx.session.s_step = 'id'
})



bot.hears('Buy&Sell', async (ctx) => {
    const wallet = await get_user_wallet(ctx.from.id)
    if (!wallet) { ctx.reply(`You don't have a wallet.\nPress My Wallet button and a new wallet will be created for you automatically`); return }

    ctx.reply("Now Wallet aggregates multiple sellers to provide users with 'a way' to buy/sell cryptocurrencies quickly to instantly;",
        {
            reply_markup: {
                inline_keyboard: [[{ text: "Buy", callback_data: 'BUY' }, { text: 'Sell', callback_data: 'SELL' }]]
            }
        })
})


bot.hears('Referals', (ctx) => {
    ctx.reply(`Your referal link <code>https://t.me/${ctx.botInfo.username}/start=${ctx.from.id}</code>
You will get a lifetime 5% cut for a every transaction of users who join Wallet with this link
    `, { parse_mode: "HTML" })
})


bot.hears('Cancel', (ctx) => {
    ctx.session = {}
    ctx.reply('If there was any process you were going through it is canceled')
})


bot.action(['BUY', 'SELL'], (ctx) => {
    ctx.deleteMessage().catch((e) => { })
    ctx.reply(`Select the token you want to buy:

You can also send the command "/buy Token" to specify the token you want to buy.
E.g: /buy BTC`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'BTC', callback_data: 'BTC' }, { text: 'ETH', callback_data: 'ETH', }, { text: 'USTD', callback_data: 'USDT' }, { text: 'XRP', callback_data: 'XRP' }],
                [{ text: 'Cancel', callback_data: 'CNCL' }],
            ]
        }
    })
    ctx.session.s_name = (ctx.update.callback_query as any).data
    ctx.session.s_step = 'token_name'
})



bot.action(['BTC', 'ETH', 'XRP', 'USDT'], async (ctx) => {
    ctx.deleteMessage()
    ctx.session.token_name = (ctx.update.callback_query as any).data
    const wallet = await get_user_wallet(ctx.from.id)
    if (!wallet)
        return
    if (ctx.session?.s_name == 'transfer') {
        ctx.reply('Broadcasting transaction to the blockchain')
        let res: any;

        switch (ctx.session.token_name) {
            case ('BTC'):
                res = await axios.post(`${WEB3_URI}/send/btc`, {
                    token_name: ctx.session.token_name,
                    from: wallet?.address,
                    to: ctx.session.eth,
                    value: ctx.session.amount,
                    key: ctx.session.key.slice(2)
                })
                break
            case ('ETH'):
                res = await axios.post(`${WEB3_URI}/send/eth`, {
                    from: wallet?.address,
                    to: ctx.session.eth,
                    value: ctx.session.amount,
                    key: ctx.session.key.slice(2)
                })
                break
            default:
                res = await axios.post(`${WEB3_URI}/send/token`, {
                    token_name: ctx.session.token_name,
                    from: wallet?.address,
                    to: ctx.session.eth,
                    value: ctx.session.amount,
                    key: ctx.session.key.slice(2)
                })
        }

        if (!res.data.status) {
            ctx.reply(`Error: ${res.data.reason}`)
            ctx.session = {}
            return
        }
        ctx.reply(`Transfered ${ctx.session.amount} ${ctx.session.token} to ${ctx.session.eth}`)
        ctx.session = {}
        return
    }
    else if (ctx.session?.s_name == 'balance') {
        const token = (ctx.update.callback_query as any).data
        let endpoint = ''
        switch (token) {
            case ('BTC'):
                endpoint = `/balance/btc?wif=${wallet.wif}`
                break
            case ('ETH'):
                endpoint = `/balance/eth?address=${wallet.address}`
                break
            case ('XRP'):
                endpoint = `/balance/token?token_name=XRP&address=${wallet.address}&key=${wallet.key}`
                break
            case ('USDT'):
                endpoint = `/balance/token?token_name=USDT&address=${wallet.address}&key=${wallet.key}`
                break
            default:
                ctx.reply('Unknown token name')
                return
        }
        const res = (await axios.get(`${WEB3_URI}${endpoint}`)).data
        if (!res.status) {
            ctx.reply(`Error: ${res.reason}`)
            ctx.session = {}
            return
        }

        ctx.reply(`<b>Wallet ID:</b> <code>${wallet.id}</code>

<b>Available ${token} Balance: ${res.balance}</b> `
            ,
            {
                parse_mode: 'HTML'
            })
        ctx.session = {}
        return
    }

    ctx.session.s_step = 'platform'
    ctx.reply(`${ctx.session.s_name}: ${ctx.session.token_name}
We currently support MoonPay and Ramp for selling cryptos. We recommend users choose platforms based on geography:

<b>EUR & UK - Moonpay
Europe (non Euro) - MoonpayNorth America - Ramp
Asia - Ramp
Africa - Ramp
South America - Ramp</b>

To purchase cryptos using a third-party platform, you need to accept their terms of service and go through their basic KYC process for the first transaction.`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Moonpay', callback_data: 'MOONPAY' }, { text: 'Ramp', callback_data: 'RAMP' }],
                    [{ text: 'Cancel', callback_data: 'CNCL' }],
                ]
            }
        })
})


bot.action('CNCL', (ctx) => {
    ctx.session = {}
    ctx.reply('If there was any process you were going through it is canceled')
})

bot.command('active', async(ctx)=>{
    const now = Date.now()
    const user = await User.findOne({tg_id: ctx.from.id}) as UserDoc
    user.set({last_seen: now})
    await user.save()

    ctx.reply(`${ctx.from.username} last seen at <b>${new Date(now)}</b>`, {
        parse_mode: 'HTML'
    })
})
export { bot }
