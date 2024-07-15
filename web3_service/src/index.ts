import { app } from './app'
import { Web3client } from './web3_client'
import { configDotenv } from 'dotenv'


configDotenv()

const env = process.env.ENVIRONMENT
let API = '';

let net_uri: string | undefined = ''
if (env == 'dev'){
    net_uri = process.env.DEV_NET  || ''
}else{
    net_uri = process.env.MAIN_NET  || ''
    API=process.env.API  || ''
}




const PORT = parseInt(process.env.PORT || '')

async function start(){
    if (!await Web3client.connect(net_uri + API)) {
        throw new Error("Web3 client couldn't connect to network")
    }
    console.log('Connected to Network')

    app.listen(PORT, ()=>{
        console.log(`Web3 service listening on ${PORT}`)
    })  
}


start().catch((e: Error)=>{
    console.log(e.message)
    process.exit(1)
})
console.log(`trying to connect to ${net_uri}`)