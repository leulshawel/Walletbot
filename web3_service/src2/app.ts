import express, { Request, Response } from 'express'
import { Web3client } from './web3_client'

const app = express();

app.use(express.json())

app.get('/api', (req: Request, res: Response) => {
  res.status(200).send({ status: 'OK' });
});


app.get('/api/create', (req: Request, res: Response) => {
  const { address, key, wif, btc_address } = Web3client.createAcc();

  res.status(200).send({ 
    address: address, 
    key: key,
    wif: wif,
    btc_address: btc_address
  });

});


app.get('/api/balance/eth', async(req: Request, res: Response)=>{
  const { address } = req.query as any
  Web3client.ethBalance(address).then((response)=>{
    res.status(200).send(response)
  })
})


app.get('/api/balance/btc', async(req: Request, res: Response)=>{
  const {wif} = req.query as any
  const result = await Web3client.btcBalance(wif)
  res.status(200).send(result)
})

app.get('/api/balance/token',async (req: Request, res: Response)=>{
  const {token_name, address } = req.query as any
  const result = await Web3client.tokenBalance(token_name, address)
  res.status(200).send(result)
})

app.post('/api/send/eth', async (req: Request, res: Response)=>{
  const {from, to, value, key} = req.body
  const result = await Web3client.sendEther(from, to, value, key)
  res.status(200).send(result)

})


app.post('/api/send/token', async (req: Request, res: Response)=>{
  const {token_name, from, to, value, key} = req.body
  const result = await Web3client.sendToken(token_name, from, to, value, key)
  res.status(200).send(result)

})


app.post('/api/send/btc', async (req: Request, res: Response)=>{
  const {from_wif, to_wif, value} = req.body
  const result = await Web3client.sendBitcoin(from_wif, to_wif, value)
  res.status(200).send(result)

})

export { app };
