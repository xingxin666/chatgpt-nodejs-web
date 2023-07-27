import express from 'express'
import type { RequestProps } from './types'
import cors from 'cors'

import type { ChatContext } from './chatgpt'
import { chatConfig, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'

import { isNotEmptyString } from './utils/is'
import { replyChatGPT } from './domain/chatgpt'
import { replyChatGPTBrowser } from './domain/chatgpt-browser'
import { replyBing } from './domain/bing'
import { replyClaude } from './domain/claude'
import { replyBaidu } from './domain/baidu'

const port = process.env.PORT || 3003

const app = express()
app.use(cors())

const router = express.Router()

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})


router.post('/chat-process', [auth, limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    globalThis.console.log(`${new Date().toLocaleString()} req:${JSON.stringify(req.body )}`)

    const { prompt, modelCode, options = {}, systemMessage, temperature } = req.body as RequestProps
    const promptMsg = prompt.trim()

    const gptModel3 = process.env.OPENAI_API_MODEL_3
    const gptModel4 = process.env.OPENAI_API_MODEL_4

    if (modelCode === 'GPT-3.5')
      await replyChatGPT(promptMsg, gptModel3, res,  options, systemMessage, temperature)
    else if (modelCode === 'GPT-4')
      await replyChatGPT(promptMsg, gptModel4, res, options, systemMessage, temperature)
    else if (modelCode === 'GPT_BROWSER')
      await replyChatGPTBrowser(promptMsg, gptModel3, res, options, systemMessage, temperature)
    else if (modelCode === 'BING')
      await replyBing(promptMsg, res, options, systemMessage)
    else if (modelCode === 'CLAUDE')
      await replyClaude(promptMsg, res, options, systemMessage)
    else if (modelCode === 'ERNIE-Bot' || modelCode === 'ERNIE-Bot-turbo')
      await replyBaidu(promptMsg, modelCode, res, options, systemMessage, temperature)
    else
      await replyChatGPT(promptMsg, gptModel3, res, options, systemMessage, temperature)
  }
  catch (error) {
    globalThis.console.log(`${new Date().toLocaleString()} chat-process异常:${error.message}`)
    res.write(`\n${JSON.stringify({ text: `系统繁忙，请稍后再试...` })}`)
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')

    if (process.env.AUTH_SECRET_KEY !== token)
      throw new Error('密钥无效 | Secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(port, () => globalThis.console.log(`${new Date().toLocaleString()} Server is running on port ${port}`))
