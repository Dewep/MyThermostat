const path = require('path')
const express = require('express')

const config = require('../config')
const controller = require('./controller')

const app = express()

if (config.web.trustProxy) {
  app.set('trust proxy', true)
}

app.use(function (req, res, next) {
  console.info('[server]', req.method, req.originalUrl, 'from', req.ip)
  next()
})

app.use(express.json())

app.post('/api/state/', async function (req, res, next) {
  try {
    if (req.body.password !== config.web.secret) {
      throw new Error('Bad secret access. Please refresh.')
    }

    const state = await controller.state(req.body)
    res.json(state)
  } catch (err) {
    res.status(err.status || 400)
    res.json({ error: err.message })
  }
})

app.use(express.static(path.join(__dirname, '..', 'public')))

app.listen(config.web.port || 7836)
