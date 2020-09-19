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

const puppeteer = require('puppeteer')
const { readFile, writeFile } = require('fs').promises

/* MongoDB for future experiments
const { MongoClient } = require('mongodb')

const mongoUrl = 'mongodb://127.0.0.1:27017'
const mongoClient = new MongoClient(mongoUrl, { useUnifiedTopology: true })

const connectToMongo = (client) => {
  client.connect(async (err) => {
    if (err) {
      console.log(err)
    }
    const db = client.db('freezingdb')
    const collection = db.collection('main')
    const array = await collection.find({}).toArray()
    client.close()
  })
}
*/

const Root = () => ''

let connections = []

const port = process.env.PORT || 8090
const server = express()

const webScraping = (arg) => {
  const section = `${arg.slice(0,1).toUpperCase()}${arg.slice(1).toLowerCase()}`
  // const section = 'E-Pandora'
  const url = `https://freezing.fandom.com/wiki/Category:${section}`
  console.log(url)
  try {  
    (async () => {  
      const browser = await puppeteer.launch({  
        executablePath: '/usr/bin/chromium-browser',  
        args: [  
             '--disable-gpu',  
             '--disable-dev-shm-usage',  
             '--disable-setuid-sandbox',  
             '--no-first-run',  
             '--no-sandbox',  
             '--no-zygote',  
             '--single-process',  
        ]  
      })  
      const page = await browser.newPage()  
      await page.setUserAgent('Chrome/75.0.3770.100')  
      await page.goto(url)  

      const list = await page.$$eval('.category-page__member-link', (anchors) => {  
        return anchors.map((rec) => rec.textContent)  
      })  

      console.log(list)  
      writeFile(`${__dirname}/data/${arg}.json`, JSON.stringify(list), { encoding: 'utf8' })
      await browser.close()  
    })()  
  } catch (err) {  
    console.error(err)  
  }
}

const getData = async (section, req) => {
  const data = await readFile(`${__dirname}/data/${section}.json`, { encoding: 'utf8' })
    .then((result) => JSON.parse(result))
    .catch(async () => {
      writeFile(`${__dirname}/data/${section}.json`, JSON.stringify([]), { encoding: 'utf8' })
      return []
    })
  if (data.length === 0) {
    webScraping(section)
  }
  const sectionList = data.reduce((acc, rec, index) => {
    return [...acc, { name: rec, url: `https://${req.hostname}/api/v1/${section}/${index + 1}`}]
  }, [])
  const result = { 
    count: sectionList.length,
    results: sectionList.length ? sectionList : 'in progress'
  }
  return result
}

const fillData = (req) => {
  const main = ['manga', 'character', 'pandora', 'limiter', 'valkyrie', 'e-pandora', 'nova', 'anime', 'stuff', 'location']
  return {
    mainListGeneration() {
      const result = main.reduce((acc, rec) => {
        return {...acc, [rec]: `https://${req.hostname}/api/v1/${rec}`}
      }, {})
      return result
    },
    filler(stage) {
      if (typeof stage !== 'string' || !main.includes(stage)) {
        return { 'section': 'not found' }
      }
      return getData(stage, req)
    }
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
  const data = await fillData(req).mainListGeneration()
  // connectToMongo(mongoClient)
  res.json(data)
})

server.get('/api/v1/:section', async (req, res) => {
  const { section } = req.params
  const data = await fillData(req).filler(section)
  res.json(data)
})

// const list = Array.from(document.querySelectorAll('.category-page__member-link')).map((ch) => `${ch.textContent}`)

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
