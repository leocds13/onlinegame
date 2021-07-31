import { PointObject, Rectangule, QuadTree } from './QuadTree.cjs'

export default function createGame() {
    let iniTime = new Date()

    const colors = [
        '#000000', // preto
        '#800000', // marrom
        '#FF0000', // vermelho
        '#800080', // roxo
        '#FF00FF', // rosa
        '#00FF00', // verde limão
        '#0000FF', // azul
        '#00FFFF'  // azul claro
    ]

    const state = {
        players: {},
        fruits: {},
        screen: {
            width: 100,
            height: 100
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
        const playerSpeed = (command.playerSpeed) ? command.playerSpeed : 3
        const playerScore = (command.playerScore) ? command.playerScore : 0
        const playerHistory = (command.playerHistory) ? command.playerHistory : []
        const playerMoved = true

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
            moved: playerMoved,
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
        const fruitId = (command.fruitId) ? command.fruitId : Math.floor(Math.random() * state.screen.width * state.screen.height)
        const fruitX = (command.fruitX) ? command.fruitX : Math.floor(Math.random() * (state.screen.width ))
        const fruitY = (command.fruitY) ? command.fruitY : Math.floor(Math.random() * (state.screen.height))

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

        player.history.push(
            { 
                axie: ( player.lastMove.includes('Up') || player.lastMove.includes('Down') ) ? 'y' : 'x',
                direction: ( player.lastMove.includes('Right') || player.lastMove.includes('Down') ) ? -1 : 1,
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

        console.log(player)
    }

    const acceptedKeys = {
        ArrowUp(player) {
            if (player.moved && player.lastMove != 'ArrowDownMove') {
                player.lastMove = 'ArrowUpMove'
                player.moved = false
            }
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
            if (player.moved && player.lastMove != 'ArrowUpMove') {
                player.lastMove = 'ArrowDownMove'
                player.moved = false
            }
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
            if (player.moved && player.lastMove != 'ArrowRightMove') {
                player.lastMove = 'ArrowLeftMove'
                player.moved = false
            }
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
            if (player.moved && player.lastMove != 'ArrowLeftMove') {
                player.lastMove = 'ArrowRightMove'
                player.moved = false
            }
        },
        ArrowRightMove(player, params) {
            player.fx = (player.fx + params.distance >= state.screen.width) ? params.distance - (state.screen.width - player.fx) : player.fx + params.distance

            if (player.x != Math.floor(player.fx)) {
                updateHistory(player)
            }

            player.x = Math.floor(player.fx)
            
            player.moved = true
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
            verifyFruitColision(player)
        }
    }
    
    function verifyPlayerColision(player) {
        if (!player) { return }

        let range = new Rectangule(player.x, player.y, 1, 1)
        let objs = state.qTree.query(range)
        //console.log(objs)
        for (const o of objs) {
            if (
                o.source.type == 'player' &&
                o.source.id != player.id &&
                o.x == player.x &&
                o.y == player.y
            ) {
                console.log(o)
                removePlayer({playerId: player.id})
                addScore(state.players[o.source.id])
                break
            } else if (
                o.source.type == 'history' &&
                o.x == player.x && 
                o.y == player.y
            ) {
                console.log(o)
                removePlayer({playerId: player.id})
                addScore(state.players[o.source.id])
                break
            }
        }
    }

    function verifyFruitColision(player) {
        if (!player) { return }

        let range = new Rectangule(player.x, player.y, 1, 1)
        let objs = state.qTree.query(range)

        for (const o of objs) {
            if (o.source.type == 'fruit' &&
                player.x == o.x &&
                player.y == o.y) {
                    removeFruit({fruitId: o.source.id})
                    addScore(player)
            }
        }
    }

    function startGameTimer() {
        let tmpTime = new Date()
        let durringTime = (tmpTime - iniTime) / 1000
        iniTime = tmpTime
        
        for (const playerId in state.players) {
            const player = state.players[playerId]
            
            //if (player.MoveCount == Math.floor((player.score)/10)+1) {
                movePlayer({playerId: playerId, keyPressed: player.lastMove, params: { distance: durringTime * player.speed }})
                //player.MoveCount = 0
            //} else {
            //    player.MoveCount = player.MoveCount + 1 //(Math.floor(player.score / 10)) + 1
            //}
        }

        if (Object.getOwnPropertyNames(state.fruits).length < 20) {
            addFruit({})
        }

        notifyAll('startGameTimmer')

        setTimeout(startGameTimer, 10)//-((1/(1 + Math.exp(-score)))*400))
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

// export default function createGame() {
//     const state = {
//         players: {},
//         fruits: {},
//         screen: {
//             width: 100,
//             height: 100
//         }
//     }

//     // Observer code 
//     const observers = []

//     function subscribe(observerFunction) {
//         observers.push(observerFunction)
//     }

//     function notifyAll(command) {
//         for (const observerFunction of observers) {
//             observerFunction(command)
//         }
//     }
//     // Observer

//     function addPlayer(command) {
//         const playerId = command.playerId
//         const playerX = (command.playerX) ? command.playerX : Math.floor(Math.random() * (state.screen.width))
//         const playerY = (command.playerY) ? command.playerY : Math.floor(Math.random() * (state.screen.height))
//         const playerLastMove = (command.playerLastMove) ? command.playerLastMove : Object.keys(acceptedKeys)[Math.floor(Math.random() * Object.keys(acceptedKeys).length)]
//         const playerMoveCount = (command.playerMoveCount) ? command.playerMoveCount : 0
//         const playerScore = (command.playerScore) ? command.playerScore : 0
//         const playerHistory = (command.playerHistory) ? command.playerHistory : []
//         const playerMoved = true

//         state.players[playerId] = {
//             id: playerId,
//             x: playerX,
//             y: playerY,
//             lastMove: playerLastMove, // last key pressed (Arrows)
//             MoveCount: playerMoveCount,
//             score: playerScore,
//             history: playerHistory,
//             moved: playerMoved
//         }

//         notifyAll({
//             "type": 'addPlayer',
//             "command": {
//                 state: state
//             }
//         })
//     }

//     function removePlayer(command) {
//         const playerId = command.playerId
//         const player = state.players[playerId]
//         if (player) {
//             delete state.players[playerId]

//             notifyAll({
//                 "type": 'removePlayer',
//                 "command": {
//                     state: state
//                 }
//             })
//         }
//     }

//     function addFruit(command) {
//         const fruitId = (command.fruitId) ? command.fruitId : Math.floor(Math.random() * state.screen.width * state.screen.height)
//         const fruitX = (command.fruitX) ? command.fruitX : Math.floor(Math.random() * (state.screen.width ))
//         const fruitY = (command.fruitY) ? command.fruitY : Math.floor(Math.random() * (state.screen.height))

//         state.fruits[fruitId] = {
//             x: fruitX,
//             y: fruitY
//         }
//     }

//     function removeFruit(command) {
//         const fruitId = command.fruitId

//         delete state.fruits[fruitId]
//     }

//     function addScore(player) {
//         player.score = player.score + 1

//         if (player.history.length > 0) {
//             player.history.push({ x: player.history[0].x, y: player.history[0].y })
//         } else {
//             player.history.push({ x: player.x, y: player.y })
//         }
//     }

//     function updateHistory(player) {
//         for (let i = player.history.length - 1; i >= 0; i--) {
//             const histPos = i

//             if (player.history[histPos-1]) {
//                 player.history[histPos] = player.history[histPos-1]
//             }
//         }
        
//         if (player.history[0]) {
//             player.history[0] = { x: player.x, y: player.y }
//         }
//     }

//     const acceptedKeys = {
//         ArrowUp(player) {
//             if (player.moved && player.lastMove != 'ArrowDownMove') {
//                 player.lastMove = 'ArrowUpMove'
//                 player.moved = false
//             }
//         },
//         ArrowUpMove(player) {
//             updateHistory(player)

//             player.y = (player.y - 1 < 0) ? state.screen.height - 1 : player.y - 1

//             verifyPlayerColision(player)
//             verifyFruitColision(player)
//             player.moved = true
//         },
//         ArrowDown(player) {
//             if (player.moved && player.lastMove != 'ArrowUpMove') {
//                 player.lastMove = 'ArrowDownMove'
//                 player.moved = false
//             }
//         },
//         ArrowDownMove(player) {
//             updateHistory(player)

//             player.y = (player.y + 1 >= state.screen.height) ? 0 : player.y + 1

//             verifyPlayerColision(player)
//             verifyFruitColision(player)
//             player.moved = true
//         },
//         ArrowLeft(player) {
//             if (player.moved && player.lastMove != 'ArrowRightMove') {
//                 player.lastMove = 'ArrowLeftMove'
//                 player.moved = false
//             }
//         },
//         ArrowLeftMove(player) {
//             updateHistory(player)

//             player.x = (player.x - 1 < 0) ? state.screen.width - 1 : player.x - 1
            
//             verifyPlayerColision(player)
//             verifyFruitColision(player)
//             player.moved = true
//         },
//         ArrowRight(player) {
//             if (player.moved && player.lastMove != 'ArrowLeftMove') {
//                 player.lastMove = 'ArrowRightMove'
//                 player.moved = false
//             }
//         },
//         ArrowRightMove(player) {
//             updateHistory(player)

//             player.x = (player.x + 1 >= state.screen.width) ? 0 : player.x + 1
            
//             verifyPlayerColision(player)
//             verifyFruitColision(player)
//             player.moved = true
//         }
//     }

//     function movePlayer(command){
//         const player = state.players[command.playerId]
//         const keyPressed = command.keyPressed
//         const moveFunction = acceptedKeys[keyPressed]
    
//         if (player && moveFunction) {
//             moveFunction(player)
//         }
//     }
    
//     function verifyPlayerColision(player) {
//         for (const play in state.players) {
//             const player2 = state.players[play]

//             for (const hist in player2.history) {
//                 const hitory = player2.history[hist]
//                 if (player) {
//                     if (player.x == hitory.x && player.y == hitory.y) {
//                         removePlayer({playerId: player.id})
//                         break
//                     }
//                 }
//             }
            
//             if (player) {
//                 if (player != player2 && player.x == player2.x && player.y == player2.y) {
//                     removePlayer( { playerId } )
//                 }
//             } else {
//                 break
//             }
//         }
//     }

//     function verifyFruitColision(player) {
//         if (!player) { return }

//         for (const fruitId in state.fruits) {
//             const fruit = state.fruits[fruitId]

//             if (player.x == fruit.x && player.y == fruit.y) {
//                 removeFruit({fruitId: fruitId})
//                 addScore(player)
//             }
//         }
//     }

//     function startGameTimer() {
//         for (const playerId in state.players) {
//             const player = state.players[playerId]
            
//             if (player.MoveCount == Math.floor((player.score)/10)+1) {
//                 movePlayer({playerId: playerId, keyPressed: player.lastMove})
//                 player.MoveCount = 0
//             } else {
//                 player.MoveCount = player.MoveCount + 1 //(Math.floor(player.score / 10)) + 1
//             }
//         }

//         if (Object.getOwnPropertyNames(state.fruits).length < 20) {
//             addFruit({})
//         }

//         notifyAll({
//             "type": 'startGameTimmer',
//             "command": {
//                 state: state
//             }
//         })

//         setTimeout(startGameTimer, 100)//-((1/(1 + Math.exp(-score)))*400))
//     }

//     return {
//         state,
//         movePlayer,
//         addPlayer,
//         removePlayer,
//         addFruit,
//         removeFruit,
//         startGameTimer,
//         subscribe
//     }
// }