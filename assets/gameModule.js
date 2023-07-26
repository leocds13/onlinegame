import { PointObject, Rectangule, QuadTree } from './QuadTree.cjs'

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

export default function createGame() {
    let iniTime = new Date()

    const colors = [
        '#fff700', // amarelo
        '#FF0000', // vermelho
        '#bf00ff', // roxo
        '#FF00FF', // rosa
        '#00FF00', // verde limão
        '#00FFFF'  // azul claro
    ]

    const MINSPEED = 5
    const INISPEED = 20
    const MAXFRUITS = 10
    const TIMEBOMB = 10 // seconds

    const state = {
        players: {},
        fruits: {},
        bombs: [],
        screen: {
            width: 60,
            height: 60
        }
    }

    state.qTree = new QuadTree(new Rectangule(state.screen.width / 2, state.screen.height / 2, state.screen.width / 2, state.screen.height / 2), 4)

    // Observer code 
    const observers = []

    function subscribe(observerFunction) {
        observers.push(observerFunction)
    }

    function notifyAll(from) {
        for (const observerFunction of observers) {
            observerFunction({
                type: from,
                command: {
                    state: state,
                    colors: colors
                }
            })
        }
    }

    subscribe(loadQTree)
    // Observer

    function addPlayer(command) {
        const playerId = command.playerId
        const playerX = (command.playerX) ? command.playerX : Math.floor(Math.random() * (state.screen.width))
        const playerY = (command.playerY) ? command.playerY : Math.floor(Math.random() * (state.screen.height))
        const playerColor = (command.playerColor) ? command.playerColor : colors[ Math.floor( Math.random() * colors.length ) ]
        const playerLastMove = (command.playerLastMove) ? command.playerLastMove : Object.keys(acceptedKeys)[Math.floor(Math.random() * Object.keys(acceptedKeys).length)]
        const playerSpeed = (command.playerSpeed) ? command.playerSpeed : INISPEED
        const playerScore = (command.playerScore) ? command.playerScore : 0
        const playerHistory = (command.playerHistory) ? command.playerHistory : []

        state.players[playerId] = {
            id: playerId,
            x: playerX,
            y: playerY,
            fx: playerX,
            fy: playerY,
            color: playerColor,
            lastMove: playerLastMove, // last key pressed (Arrows)
            speed: playerSpeed,
            score: playerScore,
            history: playerHistory,
            type: 'player'
        }

        notifyAll('addPlayer')
    }

    function removePlayer(command) {
        const playerId = command.playerId
        const player = state.players[playerId]
        if (player) {
            delete state.players[playerId]

            notifyAll('removePlayer')
        }
    }

    function addFruit(command) {
        let fruitList = Object.keys(state.fruits)

        let fruitId = (command.fruitId) ? command.fruitId : (fruitList.length == 0) ? 0 : parseInt(fruitList[fruitList.length - 1]) + 1
        let fruitX = (command.fruitX) ? command.fruitX : -1
        let fruitY = (command.fruitY) ? command.fruitY : -1
        
        for (let i = 0; i <= 10 && fruitX == -1 && fruitY == -1; i++) {
            let range = new Rectangule(getRandomInt(1, state.screen.width), getRandomInt(1, state.screen.height), 1, 1)
            let objs = state.qTree.query(range)

            if (objs.length < 9) {
                let validPos = true
                for (let x = range.x - 1; x <= range.x + 1; x++) {
                    for (let y = range.y - 1; y <= range.y + 1; y++) {
                        validPos = true

                        for (let o of objs) {
                            if (x == o.x && y == o.y) {
                                validPos = false
                                break
                            }
                        }

                        if (validPos) {
                            fruitX = x
                            fruitY = y
                            break
                        }
                    }

                    if (validPos) {
                        break
                    }
                }
            }

            if (i == 10 ) {
                return
            }
        }
        
        state.fruits[fruitId] = {
            id: fruitId,
            x: fruitX,
            y: fruitY,
            type: 'fruit'
        }
    }

    function removeFruit(command) {
        const fruitId = command.fruitId

        delete state.fruits[fruitId]
    }

    function addScore(player) {
        if (!player) { return }

        player.score = player.score + 1
        
        if (player.speed > MINSPEED) {
            player.speed -= 0.1
        }

        player.history.push(
            { 
                axie: (player.history.length > 0) ? player.history[player.history.length - 1].axie : (player.lastMove.includes('Up') || player.lastMove.includes('Down') ) ? 'y' : 'x' ,
                direction: (player.history.length > 0) ? 0 : ( player.lastMove.includes('Right') || player.lastMove.includes('Down') ) ? -1 : 1,
                type: 'history',
                id: player.id 
            }
        )
    }

    function updateHistory(player) {
        for (let i = player.history.length - 1; i > 0; i--) {
            const histPos = i

            player.history[histPos].axie = player.history[histPos-1].axie
            player.history[histPos].direction = player.history[histPos-1].direction
        }
        
        if (player.history[0]) {
            player.history[0].axie = ( player.lastMove.includes('Up') || player.lastMove.includes('Down') ) ? 'y' : 'x'
            player.history[0].direction = ( player.lastMove.includes('Right') || player.lastMove.includes('Down') ) ? -1 : 1
        }
    }

    function addBomb(player) {
        player.score -= 1
        
        let x = player.x
        let y = player.y

        for (let h of player.history) {
            if (h.axie == 'x') {
                x += h.direction

                if (x < 0) {
                    x = state.screen.width - 1
                } else if (x >= state.screen.width) {
                    x = 0
                }
            } else {
                y += h.direction
                if (y < 0) {
                    y = state.screen.height - 1
                } else if (y >= state.screen.height) {
                    y = 0
                }
            }
        }

        state.bombs.push({
            x: x,
            y: y,
            player: player.id,
            time: new Date(),
            type: 'bomb'
        })

        player.history.splice(player.history.length - 1, 1)
    }

    function updateBombs() {
        for(let b in state.bombs) {
            let bomb = state.bombs[b]

            if (iniTime - bomb.time >= TIMEBOMB * 1000) {
                addFruit({ fruitX: bomb.x, fruitY: bomb.y })
                state.bombs.splice(b, 1)
            }
        }
    }

    const acceptedKeys = {
        ArrowUp(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'y' && player.history[0].direction == -1) {
                    return
                }
            }

            player.lastMove = 'ArrowUpMove'
        },
        w(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'y' && player.history[0].direction == -1) {
                    return
                }
            }

            player.lastMove = 'ArrowUpMove'
        },
        ArrowUpMove(player, params) {
            player.fy = ((player.fy - params.distance) < 0) ? state.screen.height - params.distance + player.fy : player.fy - params.distance

            if (player.y != Math.floor(player.fy)) {
                updateHistory(player)
            }

            player.y = Math.floor(player.fy)

            player.moved = true
        },
        ArrowDown(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'y' && player.history[0].direction == 1) {
                    return
                }
            }
            
            player.lastMove = 'ArrowDownMove'
        },
        s(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'y' && player.history[0].direction == 1) {
                    return
                }
            }
            
            player.lastMove = 'ArrowDownMove'
        },
        ArrowDownMove(player, params) {
            player.fy = (player.fy + params.distance >= state.screen.height) ? params.distance - (state.screen.height - player.fy) : player.fy + params.distance

            if (player.y != Math.floor(player.fy)) {
                updateHistory(player)
            }

            player.y = Math.floor(player.fy)
            
            player.moved = true
        },
        ArrowLeft(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'x' && player.history[0].direction == -1) {
                    return
                }
            }
            player.lastMove = 'ArrowLeftMove'
        },
        a(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'x' && player.history[0].direction == -1) {
                    return
                }
            }
            player.lastMove = 'ArrowLeftMove'
        },
        ArrowLeftMove(player, params) {
            player.fx = (player.fx - params.distance < 0) ? state.screen.width - params.distance + player.fx : player.fx - params.distance
            
            if (player.x != Math.floor(player.fx)) {
                updateHistory(player)
            }
            
            player.x = Math.floor(player.fx)
            
            player.moved = true
        },
        ArrowRight(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'x' && player.history[0].direction == 1) {
                    return
                }
            }
            player.lastMove = 'ArrowRightMove'
        },
        d(player) {
            if (player.history.length > 0) {
                if (player.history[0].axie == 'x' && player.history[0].direction == 1) {
                    return
                }
            }
            player.lastMove = 'ArrowRightMove'
        },
        ArrowRightMove(player, params) {
            player.fx = (player.fx + params.distance >= state.screen.width) ? params.distance - (state.screen.width - player.fx) : player.fx + params.distance

            if (player.x != Math.floor(player.fx)) {
                updateHistory(player)
            }

            player.x = Math.floor(player.fx)
            
            player.moved = true
        },
        b(player) {
            if (player.history.length > 0) {
                addBomb(player)
            }
        }
    }

    function movePlayer(command){
        const player = state.players[command.playerId]
        const keyPressed = command.keyPressed
        const moveFunction = acceptedKeys[keyPressed]
        
        if (player && moveFunction) {
            moveFunction(player, command.params)
            loadQTree(state)
            verifyPlayerColision(player)
        }
    }
    
    function verifyPlayerColision(player) {
        if (!player) { return }

        let range = new Rectangule(player.x, player.y, 1, 1)
        let objs = state.qTree.query(range)

        for (const o of objs) {
            if (
                o.source.type == 'player' &&
                o.source.id != player.id &&
                o.x == player.x &&
                o.y == player.y
            ) {
                removePlayer({playerId: player.id})
                addScore(state.players[o.source.id])
                break
            } else if (
                o.source.type == 'history' &&
                o.x == player.x && 
                o.y == player.y
            ) {
                removePlayer({playerId: player.id})
                addScore(state.players[o.source.id])
                break
            }else if (o.source.type == 'fruit' &&
                player.x == o.x &&
                player.y == o.y) {
                    removeFruit({fruitId: o.source.id})
                    addScore(player)
            }else if (o.source.type == 'bomb' &&
                player.x == o.x &&
                player.y == o.y) {
                    removePlayer({playerId: player.id})
                    addScore(state.players[o.source.player])
            }
        }
    }

    // function verifyFruitColision(player) {
    //     if (!player) { return }

    //     let range = new Rectangule(player.x, player.y, 1, 1)
    //     let objs = state.qTree.query(range)

    //     for (const o of objs) {
    //         if (o.source.type == 'fruit' &&
    //             player.x == o.x &&
    //             player.y == o.y) {
    //                 removeFruit({fruitId: o.source.id})
    //                 addScore(player)
    //         }
    //     }
    // }

    function startGameTimer() {
        let tmpTime = new Date()
        let durringTime = (tmpTime - iniTime) / 1000
        iniTime = tmpTime
        
        for (const playerId in state.players) {
            const player = state.players[playerId]
            movePlayer({playerId: playerId, keyPressed: player.lastMove, params: { distance: durringTime * player.speed }})
        }

        if (Object.getOwnPropertyNames(state.fruits).length < MAXFRUITS) {
            addFruit({})
        }

        updateBombs();

        notifyAll('startGameTimmer')

        setTimeout(startGameTimer, 10)
    }

    function loadQTree(){
        state.qTree = new QuadTree(new Rectangule(state.screen.width / 2, state.screen.height / 2, state.screen.width / 2, state.screen.height / 2), 4)
        
        for (let playerId in state.players) {
            let player = state.players[playerId]
            let p = new PointObject(player.x, player.y, player)
            state.qTree.insert(p)

            let auxX = player.x
            let auxY = player.y
            for (let historyId in player.history) {
                let playerHistory = player.history[historyId]

                if (playerHistory.axie == 'x') {
                    auxX = auxX + playerHistory.direction
                    if (auxX < 0) {
                        auxX = state.screen.width - 1
                    } else if (auxX >= state.screen.width) {
                        auxX = 0
                    }
                } else {
                    auxY = auxY + playerHistory.direction
                    if (auxY < 0) {
                        auxY = state.screen.height - 1
                    } else if (auxY >= state.screen.height) {
                        auxY = 0
                    }
                }

                let ph = new PointObject(auxX, auxY, playerHistory)

                state.qTree.insert(ph)
            }
        }

        for (let fruitId in state.fruits) {
            let fruit = state.fruits[fruitId]
            let p = new PointObject(fruit.x, fruit.y, fruit)
            state.qTree.insert(p)
        }

        for (let bomb of state.bombs) {
            let p = new PointObject(bomb.x, bomb.y, bomb)
            state.qTree.insert(p)
        }
    }

    return {
        state,
        movePlayer,
        addPlayer,
        removePlayer,
        addFruit,
        removeFruit,
        startGameTimer,
        subscribe,
        loadQTree
    }
}