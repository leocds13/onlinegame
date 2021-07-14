import express from 'express'
import http from 'http'
import createGame from './public/gameModule.js'
import socketio from 'socket.io'

//const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const sockets = socketio(server)

var port = process.env.PORT || 5000

app.use(express.static('public'))

const game = createGame()

game.addPlayer({playerId: 'Player1'})//, playerX: 0, playerY:0, playerScore: 0, playerHistory: []})
game.addPlayer({ playerId: 'teste'})

game.startGameTimmer()

console.log(game.state)

sockets.on('connection', () => {
    const playerId = socket.id
    console.log(`User connected: ${playerId}`)
})

server.listen(port, () => {
    console.log(`> Server listening on port: ${port}`)
})