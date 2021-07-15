export default function createGame() {
    const state = {
        players: {},
        fruits: {},
        screen: {
            width: 10,
            height: 10
        }
    }

    const observers = []
    

    function subscribe(observerFunction) {
        observers.push(observerFunction)
    }

    function notifyAll(command) {
        for (const observerFunction of observers) {
            observerFunction(command)
        }
    }

    function addPlayer(command) {
        const playerId = command.playerId
        const playerX = (command.playerX) ? command.playerX : Math.floor(Math.random() * (state.screen.width))
        const playerY = (command.playerY) ? command.playerY : Math.floor(Math.random() * (state.screen.height))
        const playerLastMove = (command.playerLastMove) ? command.playerLastMove : Object.keys(acceptedKeys)[Math.floor(Math.random() * Object.keys(acceptedKeys).length)]
        const playerMoveCount = (command.playerMoveCount) ? command.playerMoveCount : 0
        const playerScore = (command.playerScore) ? command.playerScore : 0
        const playerHistory = (command.playerHistory) ? command.playerHistory : [{ x: playerX, y: playerY }]

        state.players[playerId] = {
            x: playerX,
            y: playerY,
            lastMove: playerLastMove, // last key pressed (Arrows)
            MoveCount: playerMoveCount,
            score: playerScore,
            history: playerHistory
        }

        notifyAll({
            "type": 'addPlayer',
            "command": {
                state: state
            }
        })
    }

    function removePlayer(command) {
        const playerId = command.playerId

        delete state.players[playerId]

        notifyAll({
            "type": 'removePlayer',
            "command": {
                state: state
            }
        })
    }

    function addFruit(command) {
        const fruitId = (command.fruitId) ? command.fruitId : Math.floor(Math.random() * state.screen.width * state.screen.height)
        const fruitX = (command.fruitX) ? command.fruitX : Math.floor(Math.random() * (state.screen.width ))
        const fruitY = (command.fruitY) ? command.fruitY : Math.floor(Math.random() * (state.screen.height))

        state.fruits[fruitId] = {
            x: fruitX,
            y: fruitY
        }
    }

    function removeFruit(command) {
        const fruitId = command.fruitId

        delete state.fruits[fruitId]
    }

    function addScore(playerId) {
        const player = state.players[playerId]

        player.score = player.score + 1

        player.history.push({ x: player.x, y: player.y })
    }

    function updateHistory(player) {
        for (const i in player.history) {
            const histPos = parseInt(i)

            if (player.history[histPos+1]) {
                player.history[histPos] = player.history[histPos+1]
            }
        }
        player.history[player.history.length - 1] = { x: player.x, y: player.y }
    }

    const acceptedKeys = {
        ArrowUp(player) {
            player.lastMove = 'ArrowUpMove'
        },
        ArrowUpMove(player) {
            updateHistory(player)
            player.y = (player.y - 1 < 0) ? state.screen.height - 1 : player.y - 1
        },
        ArrowDown(player) {
            player.lastMove = 'ArrowDownMove'
        },
        ArrowDownMove(player) {
            updateHistory(player)
            player.y = (player.y + 1 >= state.screen.height) ? 0 : player.y + 1
        },
        ArrowLeft(player) {
            player.lastMove = 'ArrowLeftMove'
        },
        ArrowLeftMove(player) {
            updateHistory(player)
            player.x = (player.x - 1 < 0) ? state.screen.width - 1 : player.x - 1
        },
        ArrowRight(player) {
            player.lastMove = 'ArrowRightMove'
        },
        ArrowRightMove(player) {
            updateHistory(player)
            player.x = (player.x + 1 >= state.screen.width) ? 0 : player.x + 1
        }
    }

    function movePlayer(command){
        const playerId = command.playerId
        const player = state.players[command.playerId]
        const keyPressed = command.keyPressed
        const moveFunction = acceptedKeys[keyPressed]
    
        if (player && moveFunction) {
            moveFunction(player)
            verifyPlayerColision(playerId)
            verifyFruitColision(playerId)
        }
    }
    
    function verifyPlayerColision(playerId) {
        const player = state.players[playerId]

        for (const play in state.players) {
            const player2 = state.players[play]
            for (const hist in player2.history) {
                const hitory = player2.history
                if (player.x == hitory.x && player.y == hitory.y) {
                    removePlayer({playerId: playerId})
                }
            }
        }
    }

    function verifyFruitColision(playerId) {
        const player = state.players[playerId]

        for (const fruitId in state.fruits) {
            const fruit = state.fruits[fruitId]

            if (player.x == fruit.x && player.y == fruit.y) {
                removeFruit({fruitId: fruitId})
                addScore(playerId)
            }
        }
    }

    function startGameTimmer() {
        for (const playerId in state.players) {
            const player = state.players[playerId]

            if (player.MoveCount == 10) {
                movePlayer({playerId: playerId, keyPressed: player.lastMove})
                player.MoveCount = 0
            } else {
                player.MoveCount = player.MoveCount + (Math.floor(player.score / 10)) + 1
            }
        }

        if (state.fruits.length < 3) {
            addFruit({})
        }

        notifyAll({
            "type": 'startGameTimmer',
            "command": {
                state: state
            }
        })
        setTimeout(startGameTimmer, 100)//-((1/(1 + Math.exp(-score)))*400))
    }

    return {
        state,
        movePlayer,
        addPlayer,
        removePlayer,
        addFruit,
        removeFruit,
        startGameTimmer,
        subscribe
    }
}