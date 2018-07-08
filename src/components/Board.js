import { map } from 'ramda'
import React from 'react'
import {
  createGame,
  gameLoop,
  hardDrop,
  moveDown,
  moveLeft,
  moveRight,
  rotateLeft,
  rotateRight
} from '../services/game'

import './Board.css'

import Puyo from './Puyo'

export default class extends React.Component {
  state = {
    game: createGame()
  }

  componentDidMount () {
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { this.setState({game: moveLeft(this.state.game)}) }
      if (e.key === 'ArrowRight') { this.setState({game: moveRight(this.state.game)}) }
      if (e.key === 'ArrowDown') { this.setState({game: moveDown(this.state.game)}) }
      if (e.key === ' ') { this.setState({game: hardDrop(this.state.game)})}
      if (e.key === 'z') { this.setState({game: rotateLeft(this.state.game)})}
      if (e.key === 'x') { this.setState({game: rotateRight(this.state.game)})}
    })

    const tick = () => {
      this.setState({game: gameLoop(this.state.game)})
      window.requestAnimationFrame(tick)
    }

    tick()
  }

  render () {
    const {game} = this.state

    return (
      <div className='Board'>
        {map(puyo => <Puyo key={puyo.id} puyo={puyo}/>, game.puyos)}
      </div>
    )
  }
}
