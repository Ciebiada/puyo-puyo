import {
  any,
  assoc,
  concat,
  dec,
  dropLast,
  find,
  head,
  inc,
  isNil,
  last,
  map,
  pipe,
  reduce,
  tail,
  takeLast,
  until
} from 'ramda'

export const boardWidth = 6
export const boardHeight = 12

const createFalling = () => [
  {color: Math.floor(Math.random() * 2), id: Math.random(), x: 2, y: -1},
  {color: Math.floor(Math.random() * 2), id: Math.random(), x: 2, y: 0},
]

const getFalling = game => takeLast(2, game.puyos)

const updateFalling = falling => game =>
  assoc('puyos', concat(dropLast(falling.length, game.puyos), falling), game)

const outOfBounds = ({x, y}) => (x < 0) || (x >= boardWidth) || (y >= boardHeight)

const hitsTheBoard = game => ({x, y}) => !isNil(game.board[`${x}x${y}`])

const collision = game => any(p => outOfBounds(p) || hitsTheBoard(game)(p))

const updateBoard = game =>
  assoc('board', reduce(
    (acc, puyo) => assoc(`${puyo.x}x${puyo.y}`, puyo.color, acc),
    {},
    game.puyos), game)

const pullDown = game => puyo => pipe(
  until(p => collision(game)([p]), p => assoc('y', p.y + 1, p)),
  p => assoc('y', p.y - 1, p)
)(puyo)

const nextPiece = game => {
  const falling = getFalling(game)
  const rot = last(falling).rot || 0

  const pulled = (rot % 2) === 0
    ? falling
    : map(pullDown(game), falling)

  return pipe(
    updateFalling(pulled),
    updateBoard,
    g => assoc('puyos', concat(g.puyos, createFalling()), g)
  )(game)
}

const rotate = (mutateX, mutateY, mutateRot) => game => {
  const falling = getFalling(game)
  const pivot = head(falling)

  const rotated = concat([pivot], map(p => {
    const x = p.x - pivot.x
    const y = p.y - pivot.y
    return pipe(
      assoc('x', mutateX({x, y}) + pivot.x),
      assoc('y', mutateY({x, y}) + pivot.y),
      assoc('rot', mutateRot(p.rot || 0)),
      assoc('deltaX', mutateX({x, y})),
      assoc('deltaY', mutateY({x, y}))
    )(p)
  }, tail(falling)))

  const kicked = find(puyos => !collision(game)(puyos))([
    rotated,
    map(p => assoc('y', dec(p.y), p), rotated),
    map(p => assoc('x', dec(p.x), p), rotated),
    map(p => assoc('x', inc(p.x), p), rotated)
  ])

  return kicked
    ? updateFalling(kicked)(game)
    : game
}

export const createGame = () => ({
  puyos: createFalling(),
  board: {},
  lastDrop: Date.now()
})

export const gameLoop = game =>
  (Date.now() - game.lastDrop > 500)
    ? assoc('lastDrop', Date.now(), moveDown(game))
    : game

export const moveDown = game => {
  const falling = getFalling(game)
  const moved = map(p => assoc('y', inc(p.y), p), falling)
  return collision(game)(moved)
    ? nextPiece(game)
    : updateFalling(moved)(game)
}

export const hardDrop = game => {
  const falling = getFalling(game)

  const dropped = pipe(
    until(
      collision(game),
      map(p => assoc('y', inc(p.y), p))
    ),
    map(p => assoc('y', dec(p.y), p))
  )(falling)

  return pipe(
    updateFalling(dropped),
    nextPiece
  )(game)
}

export const moveRight = game => {
  const falling = map(p => assoc('x', inc(p.x), p), getFalling(game))
  return collision(game)(falling) ? game : updateFalling(falling)(game)
}

export const moveLeft = game => {
  const falling = map(p => assoc('x', dec(p.x), p), getFalling(game))
  return collision(game)(falling) ? game : updateFalling(falling)(game)
}

export const rotateRight = rotate(({y}) => -y, ({x}) => x, inc)

export const rotateLeft = rotate(({y}) => y, ({x}) => -x, dec)

