import mongoose  from 'mongoose'
// import { MongoMemoryServer } from 'mongodb-memory-server'
import { bot } from './bot'


async function start() {
    try{
        const MONGO_URI = process.env.MONGO_URI
        // const mongo = await MongoMemoryServer.create();
        // const uri = mongo.getUri();
        // const M = MONGO_URI != undefined
        await mongoose.connect(MONGO_URI as string)
        console.log('connected to db')
    }catch (err){ console.log(err)}



    bot.catch((err, ctx) => {
        ctx.reply('An error occurred. Please try again later.');
        console.log(err)
        ctx.session = {}
    });

    bot.launch()
    console.log('Bot up and running')

}



start()