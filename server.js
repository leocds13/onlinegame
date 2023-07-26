import express from 'express'
import http from 'http'
import createGame from './assets/gameModule.js'
import { Server } from 'socket.io'

//const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const sockets = new Server(server)

var port = process.env.PORT || 5000

// app.use(express.static('public'))

const game = createGame()

game.subscribe((command) => {
    sockets.emit('updateState', command.command)
})

game.startGameTimer()

sockets.on('connection', (socket) => {
    const playerId = socket.id
    console.log(`> Player connected: ${playerId}`)

    game.addPlayer( { playerId } )

    socket.on('disconnect', () => {
        console.log(`> Player disconnected: ${playerId}`)
        game.removePlayer( { playerId } )

    })

    socket.on('movePlayer', (command) => {
        game.movePlayer(command)
    })

    socket.on('reconnect', () => {
        game.addPlayer( { playerId } )
        console.log(`> Player REconnected: ${playerId}`)
    })
})

server.listen(port, () => {
    console.log(`> Server listening on port: ${port}`)
})