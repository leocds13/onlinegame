import exp from 'constants'
import express from 'express'
import http from 'http'

const app = expres()
const server = http.createServer(app)

var port = process.env.PORT || 5000

app.use(express.static('public'))

server.listen(port, () => {
    console.log(`> Server listening on port: ${port}`)
})