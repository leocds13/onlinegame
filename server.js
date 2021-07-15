import express from 'express'
import http from 'http'
import createGame from './public/gameModule.js'
import { Server } from 'socket.io'

//const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const sockets = new Server(server)

var port = process.env.PORT || 5000

app.use(express.static('public'))

const game = createGame()

game.subscribe((command) => {
    sockets.emit('updateState', command.command.state)
})

// game.addPlayer({playerId: 'Player1'})//, playerX: 0, playerY:0, playerScore: 0, playerHistory: []})
// game.addPlayer({ playerId: 'teste'})

game.startGameTimmer()

sockets.on('connection', (socket) => {
    const playerId = socket.id
    console.log(`> Player connected: ${playerId}`)

    socket.on('disconnect', () => {
        console.log(`> Player disconnected: ${playerId}`)
        game.removePlayer( { playerId } )

    })

    game.addPlayer( { playerId } )

    //socket.emit('startState', game.state)
})

server.listen(port, () => {
    console.log(`> Server listening on port: ${port}`)
})