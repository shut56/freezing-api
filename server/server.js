import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import { renderToStaticNodeStream } from 'react-dom/server'
import React from 'react'

import cookieParser from 'cookie-parser'
import config from './config'
import Html from '../client/html'

const { readFile, writeFile } = require('fs').promises

const Root = () => ''

let connections = []

const port = process.env.PORT || 8090
const server = express()

const fillMainObject = (req) => {
  const base = {
    manga: [
      'Freezing',
      'Freezing: First Chronicles',
      'Freezing: Zero',
      'Freezing: Giant Issue',
      'Sexy Dynamite Bomber',
      'Eroizing',
    ],
    anime: [
      'Freezing',
      'Freezing: Vibration',
    ]
  }
  const main = ['manga', 'character', 'pandora', 'limiter', 'valkyrie', 'e-pandora', 'nova', 'anime', 'stuff']
  return async () => {
    const data = await readFile(`${__dirname}/data/main.json`, { encoding: 'utf8' }).then((result) => JSON.parse(result))
    const result = main.reduce((acc, rec) => {
      if (Array.isArray(base[rec])) {
        return {...acc, [rec]: base[rec].map((title, index) => `${req.hostname}/api/v1/${rec}/${index + 1}`)}
      }
      return {...acc, [rec]: ''}
    }, {})
    // const result = {...data, [stage1]: base[stage1].map((title, index) => `${req.hostname}/api/v1/${stage1}/${index + 1}`)}
    writeFile(`${__dirname}/data/main.json`, JSON.stringify({ ...data, ...result }), {
      encoding: 'utf8'
    })
    return result
  }
}

const middleware = [
  cors(),
  express.static(path.resolve(__dirname, '../dist/assets')),
  bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
  bodyParser.json({ limit: '50mb', extended: true }),
  cookieParser()
]

middleware.forEach((it) => server.use(it))

server.get('/api/v1', async (req, res) => {
  const data = await fillMainObject(req)()
  console.log('Loading complete')
  // const data = await readFile(`${__dirname}/data/main.json`, { encoding: 'utf8' }).then((result) =>
  //   JSON.parse(result)
  // )
  res.json(data)
})

server.get('/api/v1/:stage1', async (req, res) => {
  const { stage1 } = req.params
  res.json(stage1)
})

server.post('/api/v1', async (req, res) => {
  // const data = await readFile(`${__dirname}/data/main.json`, { encoding: 'utf8' }).then((result) =>
  //   JSON.parse(result)
  // )
  // const fields = req.body
  // writeFile(`${__dirname}/data/main.json`, JSON.stringify({ ...data, ...fields }), {
  //   encoding: 'utf8'
  // })
  res.send('Data is uploaded')
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const [htmlStart, htmlEnd] = Html({
  body: 'separator',
  title: 'Skillcrucial - Become an IT HERO'
}).split('separator')

server.get('/', (req, res) => {
  const appStream = renderToStaticNodeStream(<Root location={req.url} context={{}} />)
  res.write(htmlStart)
  appStream.pipe(res, { end: false })
  appStream.on('end', () => {
    res.write(htmlEnd)
    res.end()
  })
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

const app = server.listen(port)

if (config.isSocketsEnabled) {
  const echo = sockjs.createServer()
  echo.on('connection', (conn) => {
    connections.push(conn)
    conn.on('data', async () => {})

    conn.on('close', () => {
      connections = connections.filter((c) => c.readyState !== 3)
    })
  })
  echo.installHandlers(app, { prefix: '/ws' })
}
console.log(`Serving at http://localhost:${port}`)
