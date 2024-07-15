import mongoose  from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { bot } from './bot'





async function start() {
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    try{
        await mongoose.connect(uri)
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