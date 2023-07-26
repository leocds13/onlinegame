export default function renderScreen(screen, game, requestAnimationFrame) {
    const context = screen.getContext('2d')
    context.clearRect(0, 0, screen.width, screen.height)
    
    // if(game.state.qTree){
    //     showQTree(game.state.qTree)
    // }

    for (const playerId in game.state.players) {
        const player = game.state.players[playerId]

        context.fillStyle = player.color
        context.globalAlpha = 1
        context.fillRect(player.x, player.y, 1, 1)

        let auxX = player.x
        let auxY = player.y
        for (const hist of player.history) {
            context.fillStyle = player.color
            context.globalAlpha = 0.5

            if (hist.axie == 'x') {
                auxX = auxX + hist.direction
                
                if (auxX < 0) {
                    auxX = game.state.screen.width - 1
                } else if (auxX >= game.state.screen.width) {
                    auxX = 0
                }
            } else {
                auxY = auxY + hist.direction
                
                if (auxY < 0) {
                    auxY = game.state.screen.height - 1
                } else if (auxY >= game.state.screen.height) {
                    auxY = 0
                }
            }

            context.fillRect(auxX, auxY, 1, 1)
        }
    }

    for (const fruitId in game.state.fruits) {
        const fruit = game.state.fruits[fruitId]
        context.fillStyle = '#fff'
        context.globalAlpha = 1
        context.fillRect(fruit.x, fruit.y, 1, 1)
    }

    for (const b in game.state.bombs) {
        const bomb = game.state.bombs[b]
        context.fillStyle = '#fefefe'
        context.globalAlpha = 1
        context.fillRect(bomb.x, bomb.y, 1, 1)
    }

    requestAnimationFrame(() => {
        renderScreen(screen, game, requestAnimationFrame)
    })

    function showQTree(qTree) {
        context.fillStyle = 'black'
        context.globalAlpha = 1
        context.strokeRect(qTree.boundary.x - qTree.boundary.w, qTree.boundary.y - qTree.boundary.h, qTree.boundary.w * 2, qTree.boundary.h * 2)

        for(let o of qTree.pointObjects) {
            if (o) {
                context.fillStyle = 'black'
                context.globalAlpha = 1
                context.fillRect(o.x, o.y, 1, 1)
            }
        }

        if (qTree.divided) {
            if (qTree.nw) {
                showQTree(qTree.nw)
            }

            if (qTree.ne) {
                showQTree(qTree.ne)
            }

            if (qTree.sw) {
                showQTree(qTree.sw)
            }

            if (qTree.se) {
                showQTree(qTree.se)
            }
        }
    }
}