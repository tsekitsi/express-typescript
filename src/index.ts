import express from 'express' // ESModules
import { ProductMonitor } from './utils'
// const express = require('express') -> commonjs

const app = express()
app.use(express.json()) // middleware que transforma la req.body a un json

const PORT = 3000

// Initialize product monitor
const productMonitor = new ProductMonitor({
  checkInterval: 60000, // 1 minute
  headless: false // Set to true to run Chrome in background
})

app.get('/ping', (_req, res) => {
  console.log('someone pinged here!!')
  res.send('pong')
})

// Product monitor endpoints
app.get('/monitor/status', (_req, res) => {
  const status = productMonitor.getStatus()
  res.json(status)
})

app.post('/monitor/start', (_req, res) => {
  productMonitor.start()
  res.json({ message: 'Product monitor started', status: productMonitor.getStatus() })
})

app.post('/monitor/stop', (_req, res) => {
  productMonitor.stop()
  res.json({ message: 'Product monitor stopped', status: productMonitor.getStatus() })
})

app.get('/monitor/check', (_req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  void (async () => {
    try {
      const isAvailable = await productMonitor.checkProductAvailability()
      res.json({ available: isAvailable, timestamp: new Date().toISOString() })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: errorMessage })
    }
  })()
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Available endpoints:')
  console.log('  GET  /ping - Health check')
  console.log('  GET  /monitor/status - Get monitor status')
  console.log('  POST /monitor/start - Start monitoring')
  console.log('  POST /monitor/stop - Stop monitoring')
  console.log('  GET  /monitor/check - Manual availability check')

  productMonitor.start()
  console.log('Product monitor started')
})

// Handle graceful shutdown
process.on('SIGINT', (): void => {
  console.log('\nShutting down server...')
  productMonitor.stop()
  process.exit(0)
})

process.on('SIGTERM', (): void => {
  console.log('\nShutting down server...')
  productMonitor.stop()
  process.exit(0)
})
