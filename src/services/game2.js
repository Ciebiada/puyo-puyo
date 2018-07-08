import * as R from 'ramda'

export const boardWidth = 6
export const boardHeight = 12

const inbounds = ({x, y}) => (x >= 0) && (x < boardWidth) && (y < boardHeight)

const collision = board => R.any(p => !inbounds(p) || board[idx(p)])

const idx = ({x, y}) => y * boardWidth + x

const createFalling = () => [
  {color: Math.floor(Math.random() * 2), id: new Date().toJSON(), x: 2, y: -1},
  {color: Math.floor(Math.random() * 2), id: new Date().toJSON() + '1', x: 2, y: 0},
]

const move = mutateX => game => {
  const moved = R.map(p => R.assoc('x', mutateX(p.x), p), game.falling)

  return collision(game.board)(moved)
    ? game
    : R.assoc('falling', moved, game)
}

const rotate = (mutateX, mutateY, mutateRot) => game => {
  const pivot = R.head(game.falling)

  const rotated = R.concat([pivot], R.map(p => {
    const x = p.x - pivot.x
    const y = p.y - pivot.y
    return R.pipe(
      R.assoc('x', mutateX({x, y}) + pivot.x),
      R.assoc('y', mutateY({x, y}) + pivot.y),
      R.assoc('rot', mutateRot(p.rot || 0)),
      R.assoc('deltaX', mutateX({x, y})),
      R.assoc('deltaY', mutateY({x, y}))
    )(p)
  }, R.tail(game.falling)))

  const kicked = R.find(puyos => !collision(game.board)(puyos))([
    rotated,
    R.map(p => R.assoc('y', R.dec(p.y), p), rotated),
    R.map(p => R.assoc('x', R.dec(p.x), p), rotated),
    R.map(p => R.assoc('x', R.inc(p.x), p), rotated)
  ])

  return kicked
    ? R.assoc('falling', kicked, game)
    : game
}

const pullDown = board => puyo => R.pipe(
  R.until(p => collision(board)([p]), p => R.assoc('y', p.y + 1, p)),
  p => R.assoc('y', p.y - 1, p)
)(puyo)

const storeFalling = game => {
  const rot = R.last(game.falling).rot || 0

  const pulled = (rot % 2) === 0
    ? game.falling
    : R.map(pullDown(game.board), game.falling)

  const stored = R.pipe(
    R.assoc('lastDrop', 0),
    R.assoc('falling', createFalling()),
    ...R.map(p => g => R.assoc('board', R.update(idx(p), p, g.board), g), pulled)
  )(game)

  return stored
}

export const createGame = () => ({
  board: R.repeat(null, boardWidth * boardHeight),
  lastDrop: Date.now(),
  falling: createFalling()
})

export const getPuyos = game => R.pipe(R.reject(R.isNil), R.concat(game.falling))(game.board)

export const gameLoop = game => game
  // Date.now() - game.lastDrop > 500
  //   ? R.assoc('lastDrop', Date.now(), moveDown(game))
  //   : game

export const moveDown = game => {
  const moved = R.map(p => R.assoc('y', R.inc(p.y), p), game.falling)

  return collision(game.board)(moved)
    ? storeFalling(game)
    : R.assoc('falling', moved, game)
}

export const hardDrop = game => {
  const pulled = R.pipe(
    R.until(
      collision(game.board),
      R.map(p => R.assoc('y', p.y + 1, p))
    ),
    R.map(p => R.assoc('y', p.y - 1, p))
  )(game.falling)

  return storeFalling(R.assoc('falling', pulled, game))
}

export const moveRight = move(R.inc)

export const moveLeft = move(R.dec)

export const rotateRight = rotate(({y}) => -y, ({x}) => x, R.inc)

export const rotateLeft = rotate(({y}) => y, ({x}) => -x, R.dec)

// import * as R from 'ramda'
//
// export const boardWidth = 6
// export const boardHeight = 12
//
// export const createGame = () => ({
//   board: R.repeat(null, boardWidth * boardHeight),
//   lastDrop: Date.now(),
//   falling: createFallingPieces()
// })
//
// export const getPieces = game => [...game.board.filter(x => x), ...game.falling]
//
// export const gameLoop = game => {
//   return (Date.now() - game.lastDrop > 500)
//     ? R.assoc('lastDrop', Date.now(), moveDown(game))
//     : game
// }
//
// export const moveLeft = game => {
//   const newPiece = R.map(piece => R.assoc('x', piece.x - 1, piece), game.falling)
//
//   return collision(game.board)(newPiece)
//     ? game
//     : R.assoc('falling', newPiece, game)
// }
//
// export const moveRight = game => {
//   const newPiece = R.map(piece => R.assoc('x', piece.x + 1, piece), game.falling)
//
//   return collision(game.board)(newPiece)
//     ? game
//     : R.assoc('falling', newPiece, game)
// }
//
// export const moveDown = game => {
//   const newPiece = R.map(piece => R.assoc('y', piece.y + 1, piece), game.falling)
//
//   return collision(game.board)(newPiece)
//     ? storePiece(game.falling)(game)
//     : R.assoc('falling', newPiece, game)
// }
//
// export const hardDrop = game => {
//   const newPiece = R.until(
//     collision(game.board),
//     piece => R.assoc('y', piece.y + 1, piece)
//   )(game.falling)
//
//   return R.pipe(
//     R.assoc('lastDrop', Date.now()),
//     storePiece(R.assoc('y', newPiece.y - 1, newPiece))
//   )(game)
// }
//
// const removePiece = (x, y) => board => {
//   const y2 = R.until(
//     y => y === 0 || board[idx(x, y)],
//     y => y - 1,
//     y - 1
//   )
//
//   const updatedPiece = board[idx(x, y2)]
//     ? R.assoc('y', y, board[idx(x, y2)])
//     : null
//
//   const updatedBoard = R.update(idx(x, y), updatedPiece, board)
//
//   return updatedPiece
//     ? removePiece(x, y2)(updatedBoard)
//     : updatedBoard
// }
//
// const removePieces = pieces => board => {
//   const sortedPieces = R.sortBy(R.prop('y'), pieces)
//
//   return R.reduce(
//     (acc, piece) => removePiece(piece.x, piece.y)(acc),
//     board,
//     sortedPieces
//   )
// }
//
// const storePiece = piece => game => {
//   const newGame = R.pipe(
//     R.assoc('falling', createFallingPieces()),
//     g => R.assoc('board', R.update(idx(piece[0].x, piece[0].y), piece[0], g.board), g),
//     g => R.assoc('board', R.update(idx(piece[1].x, piece[1].y), piece[1], g.board), g)
//   )(game)
//
//   console.log(piece)
//
//   const links = R.uniqBy(R.prop('id'), R.chain(block => findLinks(block)(newGame), piece))
//
//   console.log(links)
//
//   return links.length >= 4
//     ? R.assoc('board', removePieces(links)(newGame.board), newGame)
//     : newGame
// }
//
// const createFallingPieces = () => [
//   {color: Math.floor(Math.random() * 2), id: new Date().toJSON(), x: 2, y: -1},
//   {color: Math.floor(Math.random() * 2), id: new Date().toJSON() + 'a', x: 2, y: 0},
// ]
//
// const inBounds = (x, y) => (x >= 0) && (x < boardWidth) && (y < boardHeight)
//
// const collision = board => R.any(({x, y}) => !inBounds(x, y) || board[idx(x, y)])
//
// const idx = (x, y) => y * boardWidth + x
//
// const findLinks = piece => game => {
//   const seekLinks = (x, y, path) => {
//     const links = [
//       [x, y - 1],
//       [x - 1, y],
//       [x + 1, y],
//       [x, y + 1]
//     ]
//       .filter(([x, y]) => inBounds(x, y))
//       .filter(([i, j]) => !path.includes(idx(i, j)))
//       .filter(([i, j]) => game.board[idx(i, j)] && game.board[idx(i, j)].color === piece.color)
//
//     const surroundingLinks = links.map(([i, j]) => seekLinks(i, j,
//       [...path, ...(links.map(([k, l]) => idx(k, l)))])
//     )
//
//     return links.concat(...surroundingLinks)
//   }
//
//   const links = seekLinks(piece.x, piece.y, [])
//
//   return links.map(([x, y]) => game.board[idx(x, y)])
// }
